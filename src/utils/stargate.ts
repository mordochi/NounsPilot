import { Options } from '@layerzerolabs/lz-v2-utilities';
import {
  Abi,
  Address,
  Chain,
  Hex,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  getContract,
  pad,
} from 'viem';
import { getBalance } from 'viem/actions';
import { parseAbi } from 'viem/utils';
import StargatePool from '@/abi/StargatePool.json';
import { getSrcTokenAmount, swapTx } from './1inch';
import {
  getMinimumReceivedAmount,
  polygonClient,
} from './getMinimumReceivedAmount';
import { getOperationCalldata } from './getOperationCalldata';

const allowance: (params: {
  userAddress: Address;
  tokenAddress: Address;
  spenderAddress: Address;
}) => Promise<bigint> = async (params) => {
  const { userAddress, tokenAddress, spenderAddress } = params;
  const client = polygonClient;
  const contract = getContract({
    address: tokenAddress,
    abi: erc20Abi,
    client: client,
  });
  return (await contract.read.allowance([
    userAddress,
    spenderAddress,
  ])) as bigint;
};

const approveERC20Tx = (params: {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
}) => {
  const { tokenAddress, spenderAddress, amount } = params;
  return {
    to: tokenAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [spenderAddress, amount],
    }),
  };
};

export const approveERC20TxIfNeeded = async (params: {
  userAddress: Address;
  tokenAddress: Address;
  tokenSymbol: string;
  tokenDecimals: number;
  spenderAddress: Address;
  spenderName: string;
  amount: bigint;
}) => {
  const tokenAllowance = await allowance(params);
  if (tokenAllowance < params.amount) {
    return approveERC20Tx(params);
  }
  return undefined;
};

export enum BridgeMode {
  taxi = '',
  bus = '0x01',
}

export const bridgeTx = async (params: {
  fromChain: Chain;
  toChain: Chain;
  tokenSymbol: string;
  tokenDecimals: number;
  poolAddr: Address;
  userAddr: Address;
  toAddr: Address;
  amount: bigint;
  dstEid: bigint; // Destination endpoint ID.
  mode: BridgeMode;
  composeInfo?: {
    composeMsg: Hex;
    executorLzComposeGasLimit: bigint;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rerenderFunc: (nextInput: string) => Promise<any[]>; // Rerender function to be called if the case use the token to swap for the native token as fee.
  };
}) => {
  const {
    fromChain,
    toChain,
    tokenSymbol,
    tokenDecimals,
    poolAddr,
    userAddr,
    toAddr,
    amount,
    dstEid,
    mode,
    composeInfo,
  } = params;

  const client = polygonClient;

  const stargatePool = getContract({
    address: poolAddr,
    abi: StargatePool,
    client: client,
  });

  const to = pad(toAddr); // Recipient address.
  const extraOptions =
    composeInfo && composeInfo.composeMsg.length > 2
      ? (Options.newOptions()
          .addExecutorComposeOption(
            0,
            composeInfo.executorLzComposeGasLimit,
            0n
          )
          .toHex() as Hex)
      : '0x';
  let composeMsg = composeInfo?.composeMsg ?? '0x'; // The composed message for the send() operation.
  const oftCmd = mode; // The OFT command to be executed, unused in default OFT implementations.

  const fee = (await stargatePool.read.quoteSend([
    [
      dstEid,
      to,
      10n ** BigInt(tokenDecimals),
      0n,
      extraOptions,
      composeMsg,
      oftCmd,
    ],
    false, // Whether to pay in LayerZero token.
  ])) as { nativeFee: bigint; lzTokenFee: bigint };

  const token = (await stargatePool.read.token()) as Address;

  let sendAmount = amount;
  let sendNativeAmount = amount;
  const txs = [];

  if (token === '0x0000000000000000000000000000000000000000') {
    sendAmount = sendAmount - fee.nativeFee;
  } else {
    sendNativeAmount = fee.nativeFee;
    const nativeBalance = await getBalance(client, { address: userAddr });
    if (nativeBalance < sendNativeAmount) {
      const srcTokenAmount = await getSrcTokenAmount({
        chain: fromChain,
        srcTokenAddress: token,
        dstAmount: fee.nativeFee,
        dstTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        buffer: 0.01,
      });

      const approveTx = await approveERC20TxIfNeeded({
        userAddress: userAddr,
        tokenAddress: token,
        tokenSymbol: tokenSymbol,
        tokenDecimals: tokenDecimals,
        spenderAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
        spenderName: '1inch',
        amount: srcTokenAmount,
      });
      if (approveTx) {
        txs.push({
          name: `Approve ${tokenSymbol}`,
          ...approveTx,
        });
      }

      // workaround for 1inch rate limit
      await new Promise((resolve) => setTimeout(resolve, 800));

      const { tx } = await swapTx({
        chainId: fromChain.id,
        userAddress: userAddr,
        srcTokenAddress: token,
        srcAmount: srcTokenAmount,
        dstTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      });
      txs.push(tx);
      if (sendAmount <= srcTokenAmount)
        throw new Error(
          `USDT is not enough for the bridge fee: ${formatUnits(srcTokenAmount, tokenDecimals)}.`
        );
      sendAmount -= srcTokenAmount;

      if (composeInfo && composeInfo.composeMsg !== '0x') {
        const minimumReceivedAmount = await getMinimumReceivedAmount(
          poolAddr,
          dstEid,
          sendAmount,
          toAddr
        );

        const sharedDecimals =
          (await stargatePool.read.sharedDecimals()) as number;
        const nextInput = formatUnits(
          minimumReceivedAmount, // new minimumReceivedAmount
          sharedDecimals
        );

        const rerenderTxs = await composeInfo.rerenderFunc(nextInput);

        const calldata = await getOperationCalldata(
          toAddr,
          rerenderTxs.map((tx) => ({
            to: tx.to,
            value: tx.value,
            data: tx.data || '0x',
          }))
        );

        composeMsg = calldata;
      }
    }

    const approveTx = await approveERC20TxIfNeeded({
      userAddress: userAddr,
      tokenAddress: token,
      tokenSymbol,
      tokenDecimals,
      spenderAddress: poolAddr,
      spenderName: 'Stargate',
      amount: sendAmount,
    });
    if (approveTx) {
      txs.push({
        name: `Approve ${tokenSymbol}`,
        ...approveTx,
      });
    }
  }

  // Slippage 0.5%
  const minSendAmount = (sendAmount * 995n) / 1000n;

  const quote = (await stargatePool.read.quoteOFT([
    [dstEid, to, sendAmount, 0n, extraOptions, composeMsg, oftCmd],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])) as any[];
  const receivedAmount = quote[2].amountReceivedLD;
  txs.push({
    name: 'Bridge',
    description: `${formatUnits(amount, tokenDecimals)} ${tokenSymbol} from ${fromChain.name} to ${toChain.name} via Stargate, you will receive ${formatUnits(receivedAmount, tokenDecimals)} ${tokenSymbol}`,
    to: poolAddr,
    value: sendNativeAmount,
    data: encodeFunctionData({
      abi: StargatePool,
      functionName: 'send',
      args: [
        [
          dstEid,
          to,
          sendAmount,
          minSendAmount,
          extraOptions,
          composeMsg,
          oftCmd,
        ],
        fee,
        userAddr,
      ],
    }),
    abi: StargatePool as Abi,
    meta: {
      highlights: ['Stargate'],
      tokenSymbols: [tokenSymbol],
    },
  });
  return txs;
};

export const getStargatePoolToken = async (stargatePool: Address) => {
  const client = polygonClient;

  const poolContract = getContract({
    address: stargatePool,
    abi: parseAbi(['function token() external view returns (address)']),
    client,
  });

  const token = await poolContract.read.token();

  return token;
};
