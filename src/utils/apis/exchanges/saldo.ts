import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    let asks: number[][] = []
    let bids: number[][] = []
    const response = await fetch('https://api.saldo.com.ar/json/rates/banco')

    if (response.ok) {
      const jsonResponse = JSON.parse(await response.text())

      switch (asset) {
        case 'BTC':
          asks = [[jsonResponse.bitcoin.ask, 1]]
          bids = [[jsonResponse.bitcoin.bid, 1]]
          break
        case 'USDT':
          asks = [[jsonResponse.usdt.ask, 1]]
          bids = [[jsonResponse.usdt.bid, 1]]
          break
        case 'DAI':
          asks = [[jsonResponse.dai.ask, 1]]
          bids = [[jsonResponse.dai.bid, 1]]
          break
        default:
          return undefined
      }

      return {
        asks,
        bids
      }
    } else {
      return undefined
    }
  } catch (error) {
    console.log(error)
    return undefined
  }
}
