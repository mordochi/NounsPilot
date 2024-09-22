import { Address } from 'viem';

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
  const query = new URLSearchParams(
    tokenAddresses.map((address) => ['addresses', address])
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
    const data = await response.json();
  
    return Response.json(data, {
      status: 200,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }

}
