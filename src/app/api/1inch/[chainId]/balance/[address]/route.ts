export async function GET(
  request: Request,
  { params }: { params: { chainId: string; address: string } }
) {
  const response = await fetch(
    `https://api.1inch.dev/balance/v1.2/${params.chainId}/balances/${params.address}`,
    {
      headers: {
        Authorization: `Bearer ${process.env._1inch_API_KEY}`,
      },
    }
  );

  const data = await response.json();

  return Response.json(data, {
    status: 200,
  });
}
