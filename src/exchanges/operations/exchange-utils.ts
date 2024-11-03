import { IExchangeBase, IPair } from '../../data/model/exchange_base.model.js';

/**
 * Gets all the available pair for the exchanges, removing duplicates.
 * @param exchanges
 * @returns
 */
export function reduceAvailablePairs(exchanges: IExchangeBase[]): IPair[] {
  return exchanges
    .map((b) => b.availablePairs)
    .reduce((prev, curr) => prev.concat(curr), [])
    .filter(
      (outerPair, index, array) =>
        array.findIndex(
          (pair) =>
            pair.crypto === outerPair.crypto && pair.fiat === outerPair.fiat
        ) === index
    );
}

export function calculateOrderBookAvgPrice(orders: number[][], volume: number) {
  if (orders.length <= 0) {
    return 0;
  }

  let totalQuantity = 0;
  let sum = 0;
  let i = 0;

  while (i < orders.length && totalQuantity < volume) {
    if (orders[i][1] <= volume - totalQuantity) {
      sum += orders[i][0] * orders[i][1];
      totalQuantity += orders[i][1];
    } else {
      sum += orders[i][0] * (volume - totalQuantity);
      totalQuantity = volume;
    }
    i++;
  }

  return sum / totalQuantity;
}
