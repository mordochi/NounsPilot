import { AbiParameter, Address } from 'viem';
import * as chains from 'viem/chains';

export const TokenAddress = {
  USDCe: {
    groupName: 'stablecoin',
    addresses: {
      Polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      Arbitrum: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    },
  },
  USDC: {
    groupName: 'stablecoin',
    addresses: {
      Mainnet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      Polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      Arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
  },
  USDT: {
    groupName: 'stablecoin',
    addresses: {
      Mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      Polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      Arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
  },
  DAI: {
    groupName: 'stablecoin',
    addresses: {
      Mainnet: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    }
  },
} satisfies Record<
  string,
  {
    groupName: string;
    addresses: Record<string, Address>;
  }
>;

export const getChain = (id: number) => {
  return Object.values(chains).find((x) => x.id === id);
};

export enum ScanAction {
  getAbi = 'getabi',
  getSourcecode = 'getsourcecode',
}

export const getExplorerUrl = (
  chainId: number,
  address: Address,
  action: ScanAction
): string => {
  switch (chainId) {
    case chains.mainnet.id:
      return `${process.env.ETHERSCAN_API}module=contract&action=${action}&address=${address}&apikey=${process.env.ETHERSCAN_API_KEY}`;
    case chains.polygon.id:
      return `${process.env.POLYGONSCAN_API}module=contract&action=${action}&address=${address}&apikey=${process.env.POLYGONSCAN_API_KEY}`;
    case chains.arbitrum.id:
      return `${process.env.ARBISCAN_API}module=contract&action=${action}&address=${address}&apikey=${process.env.ARB_ETHERSCAN_API_KEY}`;
    default:
      throw new Error('Unsupported chainId');
  }
};

export const fetchAbi = async (
  chainId: number,
  address: Address
): Promise<AbiParameter[]> => {
  const explorerUrl = getExplorerUrl(chainId, address, ScanAction.getAbi);
  const response = await fetch(explorerUrl);
  const data = await response.json();
  return JSON.parse(data.result) as AbiParameter[];
};

export const floor = (value: number | null, decimals: number): number => {
  return Math.floor((value ?? 0) * 10 ** decimals) / 10 ** decimals;
}