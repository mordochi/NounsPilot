import { Options } from '@layerzerolabs/lz-v2-utilities';
import {
  Address,
  Hex,
  createPublicClient,
  encodeAbiParameters,
  getContract,
  http,
  parseAbiParameters,
} from 'viem';
import { polygon } from 'viem/chains';
import StargatePoolMigratable from '@/abi/StargatePoolMigratable.json';

export const polygonClient = createPublicClient({
  batch: {
    multicall: true,
  },
  chain: polygon,
  transport: http(),
});

// Helper function to convert address to bytes32
const addressToBytes32 = (address: Address): Hex => {
  return encodeAbiParameters(parseAbiParameters('address'), [address]) as Hex;
};

export interface SendParam {
  dstEid: bigint;
  to: `0x${string}`;
  amountLD: bigint;
  minAmountLD: bigint;
  extraOptions: Hex;
  composeMsg: Hex;
  oftCmd: Hex;
}

export const getSendParam = (
  dstEid: bigint,
  composer: Address,
  amountLD: bigint,
  executorLzComposeGasLimit: bigint,
  composeMsg: Hex
): SendParam => {
  const extraOptions =
    composeMsg.length > 2
      ? (Options.newOptions()
          .addExecutorComposeOption(0, executorLzComposeGasLimit, 0n)
          .toHex() as Hex)
      : '0x';
  return {
    dstEid,
    to: addressToBytes32(composer),
    amountLD,
    minAmountLD: amountLD, // just a placeholder
    extraOptions,
    composeMsg,
    oftCmd: '0x',
  };
};

interface OFTReceipt {
  amountReceivedLD: bigint;
}

export const getMinimumReceivedAmount = async (
  stargate: Address,
  dstEid: bigint,
  amount: bigint,
  composer: Address
): Promise<bigint> => {
  const sendParam: SendParam = getSendParam(dstEid, composer, amount, 0n, '0x');

  // Create contract instance
  const contract = getContract({
    address: stargate,
    abi: StargatePoolMigratable,
    client: polygonClient,
  });

  // Call the quoteOFT function on the contract
  const [, , receipt] = (await contract.read.quoteOFT([sendParam])) as [
    unknown,
    unknown,
    OFTReceipt,
  ];

  return receipt.amountReceivedLD;
};

export const prepareTakeTaxiAndAMMSwap = async (
  stargate: Address,
  dstEid: bigint,
  amount: bigint,
  composer: Address,
  executorLzComposeGasLimit: bigint,
  composeMsg: Hex
): Promise<SendParam> => {
  const sendParam: SendParam = getSendParam(
    dstEid,
    composer,
    amount,
    executorLzComposeGasLimit,
    composeMsg
  );

  // Create contract instance
  const contract = getContract({
    address: stargate,
    abi: StargatePoolMigratable,
    client: polygonClient,
  });

  // Call the quoteOFT function on the contract
  const [, , receipt] = (await contract.read.quoteOFT([sendParam])) as [
    unknown,
    unknown,
    OFTReceipt,
  ];

  sendParam.minAmountLD = receipt.amountReceivedLD;

  return sendParam;
};
