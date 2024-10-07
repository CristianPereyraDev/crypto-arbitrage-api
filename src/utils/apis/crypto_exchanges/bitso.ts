import { APIError } from '../../../types/errors/index.js';
import { IExchangePairPrices } from '../../../data/model/exchange.model.js';
import { IPair } from '../../../data/model/exchange_base.model.js';
import { fetchWithTimeout } from '../../../utils/network.utils.js';

export type BitsoAPIOrderbookResponse = {
  success: boolean;
  payload?: {
    updated_at: string;
    sequence: string;
    bids: { book: string; price: string; amount: string }[];
    asks: { book: string; price: string; amount: string }[];
  };
  error?: { message: string; code: string };
};

export async function getPairPrices(
  pairs: IPair[]
): Promise<IExchangePairPrices[]> {
  return await Promise.all(
    pairs.map(
      (pair) =>
        new Promise<IExchangePairPrices>((resolve, reject) => {
          const endpoint = `https://bitso.com/api/v3/order_book/?book=${pair.crypto.toLowerCase()}_${pair.fiat.toLowerCase()}`;

          fetchWithTimeout(endpoint)
            .then((response) => {
              if (!response.ok) {
                reject(
                  new APIError(
                    endpoint,
                    'Bitso',
                    `${response.status}: ${response.statusText}`
                  )
                );
              }

              return response.json();
            })
            .then((jsonResponse) => {
              const data = jsonResponse as BitsoAPIOrderbookResponse;

              if (data.success && data.payload) {
                resolve({
                  crypto: pair.crypto,
                  fiat: pair.fiat,
                  asksAndBids: {
                    asks: data.payload.asks.map((ask) => [
                      parseFloat(ask.price),
                      parseFloat(ask.amount),
                    ]),
                    bids: data.payload.bids.map((bid) => [
                      parseFloat(bid.price),
                      parseFloat(bid.amount),
                    ]),
                  },
                });
              } else {
                reject(
                  new APIError(
                    endpoint,
                    'Bitso',
                    data.error?.message ??
                      `There was an error when fetching the ${pair.crypto}${pair.fiat} prices`
                  )
                );
              }
            })
            .catch((reason) =>
              reject(
                new Error(
                  `There was an error when fetching the ${pair.crypto}${pair.fiat} prices from Bitso :${reason}`
                )
              )
            );
        })
    )
  );
}
