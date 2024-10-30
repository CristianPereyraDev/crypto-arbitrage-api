import { IPair } from '../../../../../../data/model/exchange_base.model.js';
import { fetchWithTimeout } from '../../../../../../utils/network.utils.js';
import { IBrokeragePairPrices } from '../../../../../../data/model/brokerage.model.js';
import { APIError } from '../../../../../../types/errors/index.js';

export type FiwindAPIResponse = {
  s: string;
  buy: number;
  sell: number;
  variation: number;
  ts: number; // Timestamp
}[];

export async function getPairPrices(
  pairs: IPair[]
): Promise<IBrokeragePairPrices[]> {
  try {
    const endpoint = 'https://api.fiwind.io/v1.0/prices/list';
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      throw new APIError(
        endpoint,
        'Fiwind',
        `${response.status} - ${response.statusText}`
      );
    }

    const apiResponse = (await response.json()) as FiwindAPIResponse;

    return pairs.map((pair) => {
      const pairData = apiResponse.find(
        (pairData) =>
          pairData.s === pair.crypto.toUpperCase() + pair.fiat.toUpperCase()
      );

      if (pairData) {
        return {
          crypto: pair.crypto,
          fiat: pair.fiat,
          ask: pairData.buy,
          bid: pairData.sell,
        };
      }

      throw new APIError(
        endpoint,
        'Fiwind',
        `Prices for pair "${pair.crypto}-${pair.fiat}" not exist`
      );
    });
  } catch (error) {
    if (!(error instanceof APIError)) {
      throw new Error(
        `There was a problem with the Fetch operation to Fiwind API: ${error}`
      );
    }

    throw error;
  }
}
