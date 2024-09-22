import { AbiParameter, Address } from 'viem';

export type DefiToken = {
  name: string;
  symbol: string;
  tokenIconURL: string;
  address: Address;
  decimals: number;
};

/**
 * @param contractAddress The address to interact with
 * @param abi
 */
export type DefiContract = {
  contractAddress: Address;
  abi: AbiParameter[];
};

export type Strategy = {
  name: string;
  platformIcon: string;
  chainId: number;
  input: DefiToken;
  contract: DefiContract;
  output: DefiToken;
  riskLevel: number; // higher means more risky
  tvl: number;
  apr: number;
};

export interface DeFiProtocol {
  name: string;
  getStrategies: (
    chainId: number,
    relatedTokens: Address[]
  ) => Promise<Strategy[]>;
}

export type OneInchTokenAsset = {
  address: Address;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  providers: string[];
  logoURI: string;
  eip2612: boolean;
  tags: string[];
  rating: number;
};

export type OneInchTokenResponse = Record<string, OneInchTokenAsset>;
