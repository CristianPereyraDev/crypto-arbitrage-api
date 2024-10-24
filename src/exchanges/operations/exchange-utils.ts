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
