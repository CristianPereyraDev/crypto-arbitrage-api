import { APIError } from '../../../types/errors/index.js';
import { IBrokeragePairPrices } from '../../../data/model/brokerage.model.js';
import { IPair } from '../../../data/model/exchange_base.model.js';
import { fetchWithTimeout } from '../../../utils/network.utils.js';

export async function getPairPrices(
  pairs: IPair[]
): Promise<IBrokeragePairPrices[]> {
  try {
    const response = await fetchWithTimeout('https://argenbtc.com/cotizacion', {
      method: 'POST',
    });

    if (response.ok) {
      const jsonResponse = JSON.parse(await response.text());

      return pairs.map((pair) => {
        let ask = 0;
        let bid = 0;
        switch (pair.crypto) {
          case 'BTC':
            ask = parseFloat(jsonResponse.precio_compra);
            bid = parseFloat(jsonResponse.precio_venta);
            break;
          case 'USDT':
            ask = parseFloat(jsonResponse.usdt_compra);
            bid = parseFloat(jsonResponse.usdt_venta);
            break;
          case 'DAI':
            ask = parseFloat(jsonResponse.dai_compra);
            bid = parseFloat(jsonResponse.dai_venta);
            break;
        }

        return {
          crypto: pair.crypto,
          fiat: pair.fiat,
          ask,
          bid,
        };
      });
    }

    throw new APIError(
      'https://argenbtc.com/cotizacion',
      'ArgenBTC',
      `${response.status} - ${response.statusText}`
    );
  } catch (error) {
    if (!(error instanceof APIError)) {
      throw new Error(
        `An error has ocurred when attempt get prices from ArgenBTC API: ${error}`
      );
    }

    throw error;
  }
}
