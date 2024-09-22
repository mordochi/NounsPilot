enum ActionType {
  Swap = 'swap',
  Quote = 'quote',
}

export async function GET(
  request: Request,
  { params }: { params: { chainId: string } }
) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  searchParams.delete('action');
  switch (action) {
    case ActionType.Quote:
      searchParams.delete('fee');
      searchParams.append('fee', '0.3');
      break;
    case ActionType.Swap:
      searchParams.delete('fee');
      searchParams.append('fee', '0.3');

      // This is the Anti-Money Laundering measures requested from 1inch team.
      const origin = searchParams.get('from');
      if (!origin)
        throw new Error(
          `The required parameter 'from' is missing in 1inch's API query.`
        );
      searchParams.append('origin', origin);
      searchParams.delete('referrer');
      searchParams.append(
        'referrer',
        '0x3f74f0af1FA2B2308dd157c7f163307e52e7fED4'
      );
      break;
    default:
      throw new Error('Invalid action');
  }

  const apiUrl = `https://api.1inch.dev/swap/v6.0/${params.chainId}/${action}?`;

  const response = await fetch(apiUrl + searchParams, {
    headers: {
      Authorization: `Bearer ${process.env._1inch_API_KEY}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    return Response.json(
      { error: data.description },
      { status: response.status }
    );
  }
  return Response.json(data);
}
