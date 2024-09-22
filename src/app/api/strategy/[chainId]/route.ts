import { Address, getAddress } from 'viem';
import { Strategy } from './types';
import { TokenAddress } from './utils';
import { yearn } from './yearn';

const getRelatedTokens = (
  chainId: number,
  tokenAddress: Address
): Address[] => {
  // iterate through TokenAddress and return all addresses that match the groupName
  const groupName = Object.values(TokenAddress).find((token) =>
    (Object.values(token.addresses) as Address[]).includes(
      getAddress(tokenAddress)
    )
  )?.groupName;
  if (!groupName) return [tokenAddress];
  return Object.values(TokenAddress)
    .filter((token) => token.groupName === groupName)
    .flatMap((token) => Object.values(token.addresses).map(getAddress));
};

const protocolHandler = async (chainId: number, tokenAddress: Address) => {
  const supportedProtocols = [yearn];

  const finalStrategies: Strategy[] = [];
  for (const protocol of supportedProtocols) {
    const relatedTokens = getRelatedTokens(chainId, tokenAddress);
    const strategies = await protocol.getStrategies(chainId, relatedTokens);
    finalStrategies.push(...strategies);
  }
  return finalStrategies;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bigIntReplacer = (_key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export async function GET(
  request: Request,
  { params }: { params: { chainId: string } }
) {
  const chainId = params.chainId;
  if (!chainId) {
    return Response.json({ error: 'Chain ID is required' }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const tokenAddresses = searchParams.getAll('tokenAddress') as Address[];
  if (!tokenAddresses || tokenAddresses.length === 0) {
    return Response.json(
      { error: 'Token addresses are required' },
      { status: 400 }
    );
  }

  try {
    const finalStrategies: Record<string, Strategy[]> = {};
    for (const address of tokenAddresses) {
      const strategies = await protocolHandler(+chainId, address);
      if (strategies.length) finalStrategies[address] = strategies;
    }

    return Response.json(
      JSON.parse(JSON.stringify(finalStrategies, bigIntReplacer)),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.log(`error: `, error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
