import { AbiParameter, Address } from 'viem';

export type DefiToken = {
  name: string;
  symbol: string;
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
