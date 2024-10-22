/**
 *
 * @param volume
 * @param ask
 * @param bid
 * @param askFee
 * @param bidFee
 * @returns number that represents the profit in percentage. For example, for an volume(v) = 500USDT,
 * 1% means an profit = 0.01 * 500 = 5USDT
 */
export function getP2PProfit(
  volume: number,
  ask: number,
  bid: number,
  askFee: number,
  bidFee: number
): { profit: number; profitPercent: number } {
  const result = (volume * (1 - askFee) * ask * (1 - bidFee)) / bid - volume;
  return { profit: result, profitPercent: (result / volume) * 100 };
}
