import { fetchWithTimeout } from '../../../utils/network.utils.js'
import { BrokerageCollectorReturnType } from './index.js'

export type TiendaCryptoAPIResponseType = {
  [pair: string]: {
    coin: string
    timestamp: string
    buy: string
    sell: string
  }
}

export async function getPairPrices (
  baseAsset: string,
  quoteAsset: string
): Promise<BrokerageCollectorReturnType | undefined> {
  try {
    const response = await fetchWithTimeout(
      'https://api.tiendacrypto.com/v1/price/all'
    )

    if (response.ok) {
      const jsonResponse =
        (await response.json()) as TiendaCryptoAPIResponseType
      const pairData =
        jsonResponse[baseAsset.toUpperCase() + '_' + quoteAsset.toUpperCase()]

      if (pairData !== undefined) {
        return {
          ask: parseFloat(pairData.buy),
          bid: parseFloat(pairData.sell)
        }
      }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
