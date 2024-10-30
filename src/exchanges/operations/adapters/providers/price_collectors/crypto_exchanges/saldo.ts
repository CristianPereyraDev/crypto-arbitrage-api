import { IPair } from '../../../../../../data/model/exchange_base.model.js';
import { fetchWithTimeout } from '../../../../../../utils/network.utils.js';
import { IBrokeragePairPrices } from '../../../../../../data/model/brokerage.model.js';
import { APIError } from '../../../../../../types/errors/index.js';

type SaldoAPIResponse = {
  [asset: string]: {
    ask: number;
    bid: number;
    currency: string;
    bid_url: string;
    ask_url: string;
  };
};

export async function getPairPrices(
  pairs: IPair[]
): Promise<IBrokeragePairPrices[]> {
  try {
    const endpoint = 'https://api.saldo.com.ar/json/rates/banco';
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      throw new APIError(
        endpoint,
        'Saldo',
        `${response.status} - ${response.statusText}`
      );
    }

    const jsonResponse = (await response.json()) as SaldoAPIResponse;

    return pairs.map((pair) => {
      switch (pair.crypto) {
        case 'BTC':
          return {
            crypto: pair.crypto,
            fiat: pair.fiat,
            bid: jsonResponse.bitcoin.ask,
            ask: jsonResponse.bitcoin.bid,
          };

        case 'USDT':
          return {
            crypto: pair.crypto,
            fiat: pair.fiat,
            bid: jsonResponse.usdt.ask,
            ask: jsonResponse.usdt.bid,
          };

        case 'DAI':
          return {
            crypto: pair.crypto,
            fiat: pair.fiat,
            bid: jsonResponse.dai.ask,
            ask: jsonResponse.dai.bid,
          };

        default:
          throw new APIError(
            endpoint,
            'TiendaCrypto',
            `Prices for pair "${pair.crypto}-${pair.fiat}" not exist`
          );
      }
    });
  } catch (error) {
    if (!(error instanceof APIError)) {
      throw new Error(
        `There was a problem with the Fetch operation to Saldo API: ${error}`
      );
    }

    throw error;
  }
}
