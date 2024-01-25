import { fetchWithTimeout } from 'src/utils/network.utils.js'
import { BrokerageCollectorReturnType } from './index.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<BrokerageCollectorReturnType | undefined> {
  try {
    const response = await fetchWithTimeout(
      'https://api.saldo.com.ar/json/rates/banco'
    )

    if (response.ok) {
      const jsonResponse = JSON.parse(await response.text())

      switch (asset) {
        case 'BTC':
          return {
            ask: jsonResponse.bitcoin.ask,
            bid: jsonResponse.bitcoin.bid
          }

        case 'USDT':
          return { ask: jsonResponse.usdt.ask, bid: jsonResponse.usdt.bid }

        case 'DAI':
          return { ask: jsonResponse.dai.ask, bid: jsonResponse.dai.bid }

        default:
          return undefined
      }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
