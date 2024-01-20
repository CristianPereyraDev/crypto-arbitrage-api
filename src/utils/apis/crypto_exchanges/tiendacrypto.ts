import { fetchWithTimeout } from 'src/utils/network.utils.js'
import { CollectorFunctionReturnType } from './index.js'

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
): Promise<CollectorFunctionReturnType | undefined> {
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
          asks: [[parseFloat(pairData.buy), 1]],
          bids: [[parseFloat(pairData.sell), 1]]
        }
      }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
