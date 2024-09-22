import { Address, Chain, parseUnits } from 'viem';
import { swapTx } from './1inch';
import { approveERC20TxIfNeeded } from './stargate';

/**
 * Generate Approves and Swap Tx
 *
 * @param {Object} options - The options for the transaction.
 * @param {BentoChainType} options.chain - The chain type.
 * @param {Address} options.address - The user's address.
 * @param {string} options.value - The value to swap.
 * @param {Token} options.selectedToken - The selected token to swap.
 * @param {Token} options.dstToken - The dst token to receive.
 * @returns {Promise<{ txs: Tx[], dstAmount: string }>} The transaction array contain approve & swap tx and the destination amount.
 */
const approveAndSwapTx = async ({
  chain,
  address,
  value,
  selectedToken,
  dstTokenAddress,
}: {
  chain: Chain;
  address: Address;
  value: string;
  selectedToken: { address: Address; symbol: string; decimals: number };
  dstTokenAddress: Address;
}) => {
  let approveTx;

  if (selectedToken.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    approveTx = await approveERC20TxIfNeeded({
      userAddress: address,
      tokenAddress: selectedToken.address,
      tokenSymbol: selectedToken.symbol,
      tokenDecimals: selectedToken.decimals,
      spenderAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
      spenderName: '1inch',
      amount: parseUnits(value, selectedToken.decimals),
    });
  }

  const { dstAmount, tx: swappedTx } = await swapTx({
    chainId: chain.id,
    userAddress: address,
    srcTokenAddress: selectedToken.address,
    srcAmount: parseUnits(value, selectedToken.decimals),
    dstTokenAddress,
  });

  const txs = approveTx ? [approveTx, swappedTx] : [swappedTx];

  return { txs, dstAmount };
};

export { approveAndSwapTx };
