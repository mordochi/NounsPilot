/**
 * Calculates the minimum receive amount based on the given toTokenAmount and slippage.
 *
 * @param toTokenAmount - The amount of tokens to be received.
 * @param slippage - The slippage percentage as a string.
 * @returns The minimum receive amount as a bigint.
 */
function calculateMiniReceiveAmount(
  toTokenAmount: bigint,
  slippage: string
): bigint {
  const slippagePercentage = parseFloat(slippage);

  const slippageFactor = 1 - slippagePercentage / 100;

  const miniReceiveAmount =
    (BigInt(toTokenAmount.toString()) *
      BigInt(Math.floor(slippageFactor * 10000))) /
    BigInt(10000);

  return miniReceiveAmount;
}

export { calculateMiniReceiveAmount };
