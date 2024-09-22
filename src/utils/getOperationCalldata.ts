import { Address, Hex, createPublicClient, getContract, http } from 'viem';
import { arbitrum } from 'viem/chains';
import UniversalComposer from '@/abi/UniversalComposer.json';

export const getOperationCalldata = async (
  composer: Address,
  txs: {
    to: Address;
    value: bigint;
    data: Hex;
  }[]
): Promise<Hex> => {
  const client = createPublicClient({
    batch: {
      multicall: true,
    },
    chain: arbitrum,
    transport: http(),
  });

  const contract = getContract({
    address: composer,
    abi: UniversalComposer,
    client,
  });

  const operationCalldata = (await contract.read.encodeOperation([txs])) as Hex;
  return operationCalldata;
};
