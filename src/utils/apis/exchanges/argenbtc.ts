import { IPairPricing } from '../../../types/exchange.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<IPairPricing> {
  try {
    let asks: string[][] = []
    let bids: string[][] = []
    const response = await fetch('https://argenbtc.com/cotizacion', {
      method: 'POST'
    })

    if (response.ok) {
      const jsonResponse = JSON.parse(await response.text())

      switch (asset) {
        case 'BTC':
          asks = [[jsonResponse.precio_compra_f, '1']]
          bids = [[jsonResponse.precio_venta_f, '1']]
          break
        case 'USDT':
          asks = [[jsonResponse.usdt_compra_f, '1']]
          bids = [[jsonResponse.usdt_venta_f, '1']]
          break
        case 'DAI':
          asks = [[jsonResponse.dai_compra_f, '1']]
          bids = [[jsonResponse.dai_venta_f, '1']]
          break
      }
    }

    return {
      asks,
      bids
    }
  } catch (error) {
    console.log(error)
    return { asks: [], bids: [] }
  }
}
