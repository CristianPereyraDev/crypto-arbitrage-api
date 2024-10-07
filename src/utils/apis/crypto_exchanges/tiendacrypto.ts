import { IPair } from '../../../data/model/exchange_base.model.js';
import { fetchWithTimeout } from '../../../utils/network.utils.js';
import { IBrokeragePairPrices } from '../../../data/model/brokerage.model.js';
import { APIError } from '../../../types/errors/index.js';

export type TiendaCryptoAPIResponseType = {
  [pair: string]: {
    coin: string;
    timestamp: string;
    buy: string;
    sell: string;
  };
};

export async function getPairPrices(
  pairs: IPair[]
): Promise<IBrokeragePairPrices[]> {
  try {
    const endpoint = 'https://api.tiendacrypto.com/v1/price/all';
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      throw new APIError(
        endpoint,
        'TiendaCrypto',
        `${response.status} - ${response.statusText}`
      );
    }

    const apiResponse = (await response.json()) as TiendaCryptoAPIResponseType;

    return pairs.map((pair) => {
      if (
        Object.hasOwn(
          apiResponse,
          `${pair.crypto.toUpperCase()}_${pair.fiat.toUpperCase()}`
        )
      ) {
        const pairData =
          apiResponse[
            `${pair.crypto.toUpperCase()}_${pair.fiat.toUpperCase()}`
          ];

        return {
          crypto: pair.crypto,
          fiat: pair.fiat,
          ask: parseFloat(pairData.buy),
          bid: parseFloat(pairData.sell),
        };
      }

      throw new APIError(
        endpoint,
        'TiendaCrypto',
        `Prices for pair "${pair.crypto}-${pair.fiat}" not exist`
      );
    });
  } catch (error) {
    if (!(error instanceof APIError)) {
      throw new Error(
        `There was a problem with the Fetch operation to TiendaCrypto API: ${error}`
      );
    }

    throw error;
  }
}
