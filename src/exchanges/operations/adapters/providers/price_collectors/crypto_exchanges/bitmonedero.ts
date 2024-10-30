import { fetchWithTimeout } from '../../../../../../utils/network.utils.js';
import { IPair } from '../../../../../../data/model/exchange_base.model.js';
import { IBrokeragePairPrices } from '../../../../../../data/model/brokerage.model.js';
import { APIError } from '../../../../../../data/errors/index.js';

type BitmonederoAPIResponse = {
  buy_btc_ars: number;
  buy_btc_ars_fee: number;
  sell_btc_ars: number;
  buy_trxusdt_ars: number;
  buy_trxusdt_ars_fee: number;
  sell_trxusdt_ars: number;
  updated_at_prices: string;
  withdrawal_fee: number;
};

export async function getPairPrices(
  pairs: IPair[]
): Promise<IBrokeragePairPrices[]> {
  const endpoint = 'https://www.bitmonedero.com/api/btc-ars';
  const response = await fetchWithTimeout(endpoint);

  if (!response.ok) {
    throw new APIError(
      endpoint,
      'Bitmonedero',
      `${response.status} - ${response.statusText}`
    );
  }

  const jsonResponse = (await response.json()) as BitmonederoAPIResponse;

  return pairs.map((pair) => {
    switch (pair.crypto) {
      case 'BTC':
        return {
          crypto: pair.crypto,
          fiat: pair.fiat,
          ask: jsonResponse.buy_btc_ars,
          bid: jsonResponse.sell_btc_ars,
        };

      case 'USDT':
        return {
          crypto: pair.crypto,
          fiat: pair.fiat,
          ask: jsonResponse.buy_trxusdt_ars,
          bid: jsonResponse.sell_trxusdt_ars,
        };
      default:
        throw new APIError(
          endpoint,
          'Bitmonedero',
          `Prices for pair "${pair.crypto}-${pair.fiat}" not exist`
        );
    }
  });
}
