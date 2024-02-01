import { fetchWithTimeout } from '../../../utils/network.utils.js'
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
            bid: jsonResponse.bitcoin.ask,
            ask: jsonResponse.bitcoin.bid
          }

        case 'USDT':
          return { bid: jsonResponse.usdt.ask, ask: jsonResponse.usdt.bid }

        case 'DAI':
          return { bid: jsonResponse.dai.ask, ask: jsonResponse.dai.bid }

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
