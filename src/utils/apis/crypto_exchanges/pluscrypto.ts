import { fetchWithTimeout } from 'src/utils/network.utils.js'
import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    const response = await fetchWithTimeout(
      `https://api.pluscambio.com.ar/crypto/coins?front-web=true`,
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Origin: 'https://pluscrypto.com.ar',
          Referer: 'https://pluscrypto.com.ar'
        }
      }
    )

    if (response.ok) {
      const jsonResponse: any = await response.json()
      const pairData = jsonResponse.find(
        (data: any) => data.coin === asset && data.coin_to === fiat
      )

      if (pairData) {
        return {
          asks: [[pairData.buy, 1]],
          bids: [[pairData.sell, 1]]
        }
      }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
