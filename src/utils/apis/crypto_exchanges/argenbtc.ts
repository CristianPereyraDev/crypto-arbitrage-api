import { fetchWithTimeout } from '../../../utils/network.utils.js'
import { BrokerageCollectorReturnType } from './index.js'

export async function getPairPrices(
  asset: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fiat: string
): Promise<BrokerageCollectorReturnType | undefined> {
  try {
    let ask: number = 0
    let bid: number = 0
    const response = await fetchWithTimeout('https://argenbtc.com/cotizacion', {
      method: 'POST'
    })

    if (response.ok) {
      const jsonResponse = JSON.parse(await response.text())

      switch (asset) {
        case 'BTC':
          ask = parseFloat(jsonResponse.precio_compra)
          bid = parseFloat(jsonResponse.precio_venta)
          break
        case 'USDT':
          ask = parseFloat(jsonResponse.usdt_compra)
          bid = parseFloat(jsonResponse.usdt_venta)
          break
        case 'DAI':
          ask = parseFloat(jsonResponse.dai_compra)
          bid = parseFloat(jsonResponse.dai_venta)
          break
      }

      return {
        ask,
        bid
      }
    } else {
      return undefined
    }
  } catch (error) {
    console.error(error)
    return undefined
  }
}
