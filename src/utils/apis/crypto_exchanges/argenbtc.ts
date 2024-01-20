import { fetchWithTimeout } from 'src/utils/network.utils.js'
import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    let asks: number[][] = []
    let bids: number[][] = []
    const response = await fetchWithTimeout('https://argenbtc.com/cotizacion', {
      method: 'POST'
    })

    if (response.ok) {
      const jsonResponse = JSON.parse(await response.text())

      switch (asset) {
        case 'BTC':
          asks = [[parseFloat(jsonResponse.precio_compra), 1]]
          bids = [[parseFloat(jsonResponse.precio_venta), 1]]
          break
        case 'USDT':
          asks = [[parseFloat(jsonResponse.usdt_compra), 1]]
          bids = [[parseFloat(jsonResponse.usdt_venta), 1]]
          break
        case 'DAI':
          asks = [[parseFloat(jsonResponse.dai_compra), 1]]
          bids = [[parseFloat(jsonResponse.dai_venta), 1]]
          break
      }

      return {
        asks,
        bids
      }
    } else {
      return undefined
    }
  } catch (error) {
    console.error(error)
    return undefined
  }
}
