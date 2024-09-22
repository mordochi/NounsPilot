import {
  Address,
  createPublicClient,
  erc20Abi,
  getContract,
  http,
  parseUnits,
} from 'viem';
import { Chain } from 'wagmi/chains';
import _1INCH from '@/abi/1inch.json';

class InputAmountTooSmall extends Error {
  constructor(
    message: string = 'Might be input amount too small, try using bigger amount.'
  ) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getError = (errorRes: any): Error => {
  if (errorRes.error === 'insufficient liquidity') {
    return new InputAmountTooSmall();
  }
  return new Error(`${errorRes.message}`);
};

const getQuoteData = async (chainId: number, query: URLSearchParams) => {
  const response = await fetch(`/api/1inch/${chainId}?` + query);

  const data = await response.json();
  if (!response.ok) {
    const error = getError(data);
    throw error;
  }
  return {
    dstAmount: BigInt(data.dstAmount),
  };
};

const getQuote: (params: {
  chainId: number;
  srcTokenAddress: Address;
  srcAmount: bigint;
  dstTokenAddress: Address;
}) => Promise<bigint> = async (params) => {
  const { chainId, srcTokenAddress, srcAmount, dstTokenAddress } = params;
  const query = new URLSearchParams({
    action: 'quote',
    src: srcTokenAddress,
    dst: dstTokenAddress,
    amount: srcAmount.toString(),
  });
  const { dstAmount } = await getQuoteData(chainId, query);
  return dstAmount;
};

export const getSrcTokenAmount = async (param: {
  chain: Chain;
  srcTokenAddress: Address;
  dstAmount: bigint;
  dstTokenAddress: Address;
  buffer: number;
}): Promise<bigint> => {
  const client = createPublicClient({
    batch: {
      multicall: true,
    },
    chain: param.chain,
    transport: http(),
  });

  const tokenContract = getContract({
    address: param.srcTokenAddress,
    abi: erc20Abi,
    client,
  });

  const decimals = await tokenContract.read.decimals();

  const trialBase = parseUnits('1', decimals);
  const trialQuote = await getQuote({
    chainId: param.chain.id,
    srcTokenAddress: param.srcTokenAddress,
    srcAmount: trialBase,
    dstTokenAddress: param.dstTokenAddress,
  });

  const multiplier = 10n ** BigInt(decimals);

  const buffer = BigInt(multiplier) + BigInt(param.buffer * Number(multiplier));
  const srcAmount =
    (param.dstAmount * trialBase * buffer) / trialQuote / multiplier;

  // workaround for 1inch rate limit
  await new Promise((resolve) => setTimeout(resolve, 800));

  const base = await getQuote({
    chainId: param.chain.id,
    srcTokenAddress: param.srcTokenAddress,
    srcAmount: srcAmount,
    dstTokenAddress: param.dstTokenAddress,
  });
  if (base > param.dstAmount) {
    return srcAmount;
  } else {
    throw new InputAmountTooSmall();
  }
};

const getSwapCalldata = async (chainId: number, query: URLSearchParams) => {
  const response = await fetch(`/api/1inch/${chainId}?` + query);

  const data = await response.json();
  if (!response.ok) {
    const error = getError(data);
    throw error;
  }
  return {
    dstAmount: data.dstAmount as bigint,
    to: data.tx.to as Address,
    value: BigInt(data.tx.value),
    data: data.tx.data as `0x${string}`,
  };
};

export const swapTx = async (params: {
  chainId: number;
  userAddress: Address;
  srcTokenAddress: Address;
  srcAmount: bigint;
  dstTokenAddress: Address;
  slippageStr?: string;
}) => {
  const {
    chainId,
    userAddress,
    srcTokenAddress,
    srcAmount,
    dstTokenAddress,
    slippageStr,
  } = params;
  const query = new URLSearchParams({
    action: 'swap',
    src: srcTokenAddress,
    dst: dstTokenAddress,
    amount: srcAmount.toString(),
    from: userAddress,
    slippage: slippageStr == undefined ? '0.5' : slippageStr,
    disableEstimate: 'true',
  });
  try {
    const { dstAmount, to, value, data } = await getSwapCalldata(
      chainId,
      query
    );
    return {
      tx: {
        to: to,
        value: value,
        data: data,
      },
      dstAmount: BigInt(dstAmount),
    };
  } catch (error: unknown) {
    const err = getError(error);
    throw err;
  }
};
