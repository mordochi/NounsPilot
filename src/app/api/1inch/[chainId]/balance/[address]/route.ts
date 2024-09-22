import type { DefiToken, OneInchTokenResponse } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { chainId: string; address: string } }
) {
  const chainId = params.chainId;
  const address = params.address;
  if (!chainId || !address) {
    return Response.json(
      { error: 'Required params are missing' },
      { status: 400 }
    );
  }
  const balanceResponse = await fetch(
    `https://api.1inch.dev/balance/v1.2/${chainId}/balances/${address}`,
    {
      headers: {
        Authorization: `Bearer ${process.env._1inch_API_KEY}`,
      },
    }
  );

  let balanceData;
  try {
    balanceData = await balanceResponse.json();
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }

  const filteredbalanceData = Object.fromEntries(
    Object.entries<string>(balanceData).filter(
      ([_, balance]) => balance !== '0'
    )
  );

  const query = new URLSearchParams(
    Object.keys(filteredbalanceData).map((address) => ['addresses', address])
  );

  const response = await fetch(
    `https://api.1inch.dev/token/v1.2/${chainId}/custom?` + query,
    {
      headers: {
        Authorization: `Bearer ${process.env._1inch_API_KEY}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
    }
  );

  try {
    const data = (await response.json()) as OneInchTokenResponse;
    const combinedData = Object.keys(data).reduce<Record<string, DefiToken>>(
      (initial, currentKey) => {
        if (!(currentKey in initial))
          initial[currentKey] = {
            ...data[currentKey],
            balance: balanceData[currentKey],
          };
        initial[currentKey].balance = balanceData[currentKey];
        return initial;
      },
      {}
    );

    return Response.json(combinedData, {
      status: 200,
    });
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
