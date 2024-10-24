import { APIError } from '../../../types/errors/index.js';
import { IBrokeragePairPrices } from '../../../data/model/brokerage.model.js';
import { IPair } from '../../../data/model/exchange_base.model.js';
import { fetchWithTimeout } from '../../../utils/network.utils.js';

type CryptoYaAPIResponseType = {
  ask: number;
  totalAsk: number;
  bid: number;
  totalBid: number;
  time: number;
};

type AllExchangesResponseType = {
  [exchange: string]: CryptoYaAPIResponseType;
};

export async function getAllBrokeragePricesByPair(
  brokerages: string[],
  pairs: IPair[]
): Promise<Map<string, IBrokeragePairPrices[]>> {
  const lowercaseBrokerages = brokerages.map((b) =>
    b.toLowerCase().replaceAll(' ', '')
  );
  const result = new Map<string, IBrokeragePairPrices[]>();

  const exchangePairPricesMaps = await Promise.all(
    pairs.map(
      (pair) =>
        new Promise<Map<string, IBrokeragePairPrices>>((resolve, reject) => {
          const endpoint = `https://criptoya.com/api/${pair.crypto}/${pair.fiat}/0.1`;
          fetchWithTimeout(endpoint)
            .then((res) => {
              if (!res.ok) {
                throw new APIError(
                  endpoint,
                  'Criptoya',
                  `${res.status} - ${res.statusText}`
                );
              }

              return res.json();
            })
            .then((jsonResponse) => {
              const data = jsonResponse as AllExchangesResponseType;
              const value: Map<string, IBrokeragePairPrices> = new Map();

              for (const exchange of Object.keys(data)) {
                const prices = data[exchange];
                value.set(exchange, {
                  crypto: pair.crypto,
                  fiat: pair.fiat,
                  ask: prices.ask,
                  bid: prices.bid,
                });
              }

              resolve(value);
            })
            .catch((reason) => reject(reason));
        })
    )
  );

  for (const exchangePairPricesMap of exchangePairPricesMaps) {
    for (const exchange of exchangePairPricesMap.keys()) {
      if (!lowercaseBrokerages.includes(exchange)) {
        continue;
      }
      const pairPrices = exchangePairPricesMap.get(exchange);
      const pairPricesArr = result.get(exchange);

      if (!pairPrices) {
        continue;
      }

      if (!pairPricesArr) {
        result.set(exchange, [pairPrices]);
        continue;
      }

      result.set(exchange, [...pairPricesArr, pairPrices]);
    }
  }

  return result;
}

export async function getBrokeragePairPricesByExchange(
  pairs: IPair[],
  exchange: string
): Promise<IBrokeragePairPrices[]> {
  try {
    return await Promise.all<IBrokeragePairPrices>(
      pairs.map(
        (pair) =>
          new Promise((resolve, reject) => {
            const endpoint = `https://criptoya.com/api/${exchange}/${pair.crypto}/${pair.fiat}`;
            fetchWithTimeout(endpoint)
              .then((response) => {
                if (!response.ok) {
                  throw new APIError(
                    endpoint,
                    'Criptoya',
                    `${response.status} - ${response.statusText}`
                  );
                }
                return response.json();
              })
              .then((jsonResponse) => {
                const data = jsonResponse as CryptoYaAPIResponseType;

                resolve({
                  crypto: pair.crypto,
                  fiat: pair.fiat,
                  ask: data.ask,
                  bid: data.bid,
                });
              })
              .catch((reason) => reject(reason));
          })
      )
    );
  } catch (error) {
    if (!(error instanceof APIError)) {
      throw new Error(
        `There was a problem with the Fetch operation to Saldo API: ${error}`
      );
    }

    throw error;
  }
}
