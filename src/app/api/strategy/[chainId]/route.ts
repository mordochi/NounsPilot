import { Address, getAddress } from 'viem';
import { OneInchTokenResponse, Strategy } from './types';
import { TokenAddress } from './utils';
import { yearn } from './yearn';

const getRelatedTokens = (tokenAddress: Address): Address[] => {
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
  const supportedProtocols = [yearn()];

  const finalStrategies: Strategy[] = [];
  for (const protocol of supportedProtocols) {
    const relatedTokens = getRelatedTokens(tokenAddress);
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

const fetchTokenIcons = async (
  strategiesMap: Record<string, Strategy[]>
): Promise<Record<string, Strategy[]>> => {
  if (!Object.keys(strategiesMap).length) return strategiesMap;

  const chainAddressMap: Record<string, Address[]> = {};

  for (const strategies of Object.values(strategiesMap)) {
    for (const strategy of strategies) {
      const key = strategy.chainId.toString();
      if (!chainAddressMap[key]) chainAddressMap[key] = [];
      chainAddressMap[key].push(strategy.input.address);
      chainAddressMap[key].push(strategy.output.address);
    }
  }

  const chainAssetsMap: Record<string, OneInchTokenResponse> = {};

  for (const [chainIdString, tokenAddresses] of Object.entries(
    chainAddressMap
  )) {
    const query = new URLSearchParams(
      tokenAddresses.map((address) => ['tokenAddress', address])
    );
    const baseUrl = process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL
      : 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/1inch/tokens/${chainIdString}?` + query
    );
    const tokenAssets = (await response.json()) as OneInchTokenResponse;
    chainAssetsMap[chainIdString] = tokenAssets;
  }

  for (const strategiesKey of Object.keys(strategiesMap)) {
    for (let i = 0; i < strategiesMap[strategiesKey].length; i++) {
      const strategy = strategiesMap[strategiesKey][i];
      const assetsMap: OneInchTokenResponse =
        chainAssetsMap[strategy.chainId.toString()];
      strategiesMap[strategiesKey][i].input.tokenIconURL =
        assetsMap[strategy.input.address.toLowerCase()]?.logoURI;
      strategiesMap[strategiesKey][i].output.tokenIconURL =
        assetsMap[strategy.output.address.toLowerCase()]?.logoURI;
    }
  }

  return strategiesMap;
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
    let finalStrategies: Record<string, Strategy[]> = {};
    for (const address of tokenAddresses) {
      const strategies = await protocolHandler(+chainId, address);
      if (strategies.length) finalStrategies[address] = strategies;
    }

    finalStrategies = await fetchTokenIcons(finalStrategies);

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
