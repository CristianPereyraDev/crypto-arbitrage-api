import { APIError } from '../../../types/errors/index.js';
import { IExchangePairPrices } from '../../../data/model/exchange.model.js';
import { IPair } from '../../../data/model/exchange_base.model.js';
import { fetchWithTimeout } from '../../../utils/network.utils.js';

type RipioTradeAPIResponse = {
  data: {
    asks: { price: number; amount: number; id: string }[];
    bids: { price: number; amount: number; id: string }[];
    timestamp: number;
  };
  error_code: number | null;
  message: string | null;
};

export async function getPairPrices(
  pairs: IPair[]
): Promise<IExchangePairPrices[]> {
  return await Promise.all<IExchangePairPrices>(
    pairs.map((pair) => {
      const endpoint = `https://api.ripiotrade.co/v4/public/orders/level-3?pair=${pair.crypto}_${pair.fiat}`;

      return new Promise((resolve, reject) => {
        fetchWithTimeout(endpoint)
          .then((apiResponse) => {
            if (!apiResponse.ok) {
              throw new APIError(
                endpoint,
                'RipioTrade API',
                `${apiResponse.status} - ${apiResponse.statusText}`
              );
            }

            return apiResponse.json();
          })
          .then((json) => {
            const data = (json as RipioTradeAPIResponse).data;
            resolve({
              crypto: pair.crypto,
              fiat: pair.fiat,
              asksAndBids: {
                asks: data.asks.map((ask) => [ask.price, ask.amount]),
                bids: data.bids.map((bid) => [bid.price, bid.amount]),
              },
            });
          })
          .catch((reason) => reject(reason));
      });
    })
  );
}
