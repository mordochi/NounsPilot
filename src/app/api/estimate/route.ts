import {
  Address,
  Chain,
  Hex,
  concat,
  createPublicClient,
  encodeAbiParameters,
  getContract,
  http,
  pad,
  parseEther,
} from 'viem';
import { arbitrum } from 'viem/chains';
import { lzComposeABI } from './abi';

const tenderlyAPIKey = process.env.TENDERLY_API_KEY!;
const tenderlyAPIUrl = process.env.TENDERLY_API_URL!;

interface ForkResponse {
  id: string;
  fork_config: { block_number: string };
  rpcs: Array<{ url: string; name: string }>;
}

const commonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const createFork = async (
  chain: Chain
): Promise<{ id: string; blockNumber: string; adminRpcUrl: string }> => {
  const url = `${tenderlyAPIUrl}/vnets`;
  const randomNumber = Math.floor(Math.random() * 1000);

  const data = {
    slug: `bento-forked-${'arbitrum'}-${randomNumber}`.toLowerCase(),
    display_name: `Bento Forked ${'arbitrum'} ${randomNumber}`,
    fork_config: {
      network_id: chain.id,
      block_number: 'latest',
    },
    virtual_network_config: {
      chain_config: {
        chain_id: chain.id,
      },
    },
    sync_state_config: {
      enabled: false,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      'X-Access-Key': tenderlyAPIKey,
    },
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as ForkResponse;
  console.log(result, '////', data.slug);
  const adminRpc = result.rpcs.find((rpc) => rpc.name === 'Admin RPC');
  if (!adminRpc) {
    throw new Error('Admin RPC not found in the response');
  }

  return {
    id: result.id,
    blockNumber: result.fork_config.block_number,
    adminRpcUrl: adminRpc.url,
  };
};

const setBalance = async (
  adminRPCUrl: string,
  walletAddress: string,
  hexValue: Hex
) => {
  const payload = {
    jsonrpc: '2.0',
    method: 'tenderly_setBalance',
    params: [walletAddress, hexValue],
    id: Date.now(),
  };

  await fetch(adminRPCUrl, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      'X-Access-Key': tenderlyAPIKey,
    },
    body: JSON.stringify(payload),
  });
};

const setErc20Balance = async (
  adminRPCUrl: string,
  tokenAddress: string,
  walletAddress: string,
  hexValue: Hex
): Promise<void> => {
  const payload = {
    jsonrpc: '2.0',
    method: 'tenderly_setErc20Balance',
    params: [tokenAddress, walletAddress, hexValue],
    id: Date.now(),
  };

  await fetch(adminRPCUrl, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(payload),
  });
};

const simulateTransaction = async (
  chain: Chain,
  composerAddress: Address,
  composeMessage: Hex,
  srcEid: number,
  minimumReceiveAmount: number,
  virtualNetworkId: string,
  blockNumber: string
): Promise<bigint> => {
  const publicClient = createPublicClient({
    chain: chain,
    transport: http(),
  });

  const universalComposerContract = getContract({
    address: composerAddress,
    abi: lzComposeABI,
    client: publicClient,
  });

  const layerzeroEndpoint =
    (await universalComposerContract.read.endpoint()) as Address;

  const stargateOApp =
    (await universalComposerContract.read.stargateOApp()) as Address;

  // just placeholders, the value doesn't matter
  const guid =
    '0x928da101293a92dc71c15251ec2a0d61508cb2064c664ccf019d3301afb71979';
  const executor = '0xe93685f3bBA03016F02bD1828BaDD6195988D950';
  const nonce = '0x0000000000001179';

  const _srcEid = pad(('0x' + srcEid.toString(16)) as Hex, { size: 4 });
  const amountLD = pad(('0x' + minimumReceiveAmount.toString(16)) as Hex, {
    size: 32,
  });
  const composeFrom = pad(composerAddress, { size: 32 }); // we don't care about the composeFrom address here so we use composerAddress for placeholder
  const oftComposeMsg = concat([
    '0x',
    nonce,
    _srcEid,
    amountLD,
    composeFrom,
    composeMessage,
  ]);

  const callData = encodeAbiParameters(
    [
      {
        internalType: 'address',
        name: '_from',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: '_guid',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: '_message',
        type: 'bytes',
      },
      {
        internalType: 'address',
        name: '_executor',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: '_extraData',
        type: 'bytes',
      },
    ],
    [stargateOApp, guid, oftComposeMsg, executor, '0x']
  );

  const url = `${tenderlyAPIUrl}/vnets/${virtualNetworkId}/transactions/simulate`;

  const data = {
    callArgs: {
      from: layerzeroEndpoint,
      to: composerAddress,
      value: '0x0',
      data: callData,
    },
    blockNumber,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      'X-Access-Key': tenderlyAPIKey,
    },
    body: JSON.stringify(data),
  }).then((res) => res.json());

  const gasLimit = parseInt(response.gasUsed, 16);
  // add 10% buffer
  return (BigInt(gasLimit) * 110n) / 100n;
};

const deleteTenderlyTestnet = async (containerId: string): Promise<void> => {
  const url = `${tenderlyAPIUrl}/testnet/container/${containerId}`;
  await fetch(url, {
    method: 'DELETE',
    headers: {
      ...commonHeaders,
      'X-Access-Key': tenderlyAPIKey,
    },
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  if (!chainId)
    return Response.json({ error: 'chainId not provided.' }, { status: 400 });
  const chain = arbitrum;
  if (!chain)
    return Response.json({ error: 'chainId not supported.' }, { status: 400 });
  const srcEid = searchParams.get('srcEid');
  if (!srcEid)
    return Response.json({ error: 'srcEid not provided.' }, { status: 400 });
  const composerMessage = searchParams.get('composerMessage');
  if (!composerMessage)
    return Response.json(
      { error: 'composerMessage not provided.' },
      { status: 400 }
    );
  const composerAddress = searchParams.get('composerAddress');
  if (!composerAddress)
    return Response.json(
      { error: 'composerAddress not provided.' },
      { status: 400 }
    );
  const tokenAddress = searchParams.get('tokenAddress');
  if (!tokenAddress)
    return Response.json(
      { error: 'tokenAddress not provided.' },
      { status: 400 }
    );
  const userAddress = searchParams.get('userAddress');
  if (!userAddress)
    return Response.json(
      { error: 'userAddress not provided.' },
      { status: 400 }
    );
  const minimumReceiveAmount = searchParams.get('minimumReceiveAmount');
  if (!minimumReceiveAmount)
    return Response.json(
      { error: 'minimumReceiveAmount not provided.' },
      { status: 400 }
    );

  let virtualNetworkId: string | undefined;

  try {
    const { id: virNetId, blockNumber, adminRpcUrl } = await createFork(chain);
    virtualNetworkId = virNetId;

    // Set ETH balance
    const balanceHex = `0x${(parseEther('1') as bigint).toString(16)}` as Hex;

    await setBalance(adminRpcUrl, userAddress, balanceHex);

    // Set ERC20 balance
    const tokenBalanceHex = `0x${(+minimumReceiveAmount).toString(16)}` as Hex;
    await setErc20Balance(
      adminRpcUrl,
      tokenAddress,
      userAddress,
      tokenBalanceHex
    );

    const gasLimit = await simulateTransaction(
      chain,
      composerAddress as Address,
      composerMessage as Hex,
      +srcEid,
      +minimumReceiveAmount,
      virtualNetworkId,
      blockNumber
    );

    await deleteTenderlyTestnet(virNetId);

    return Response.json({ gasLimit: gasLimit.toString() });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (virtualNetworkId) {
      await deleteTenderlyTestnet(virtualNetworkId);
    }

    return Response.json(
      { error: 'Something wrong from the tenderly api: ' + error.message },
      { status: 500 }
    );
  }
}
