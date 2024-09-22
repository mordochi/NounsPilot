import { Address } from 'viem';

type OneInchTokenAsset = {
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

export type DefiToken = {
  balance: string;
} & OneInchTokenAsset;
