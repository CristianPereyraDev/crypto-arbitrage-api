import { fetchWithTimeout } from '../../../utils/network.utils.js'
import { BrokerageCollectorReturnType } from './index.js'

export async function getPairPrices(
  asset: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fiat: string
): Promise<BrokerageCollectorReturnType | undefined> {
  try {
    const response = await fetchWithTimeout(
      'https://www.bitmonedero.com/api/btc-ars'
    )

    if (response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsonResponse: any = await response.json()

      switch (asset) {
        case 'BTC':
          return {
            ask: parseFloat(jsonResponse.buy_btc_ars),
            bid: parseFloat(jsonResponse.sell_btc_ars)
          }

        case 'USDT':
          return {
            ask: parseFloat(jsonResponse.buy_trxusdt_ars),
            bid: parseFloat(jsonResponse.sell_trxusdt_ars)
          }
      }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
