import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    let asks: number[][] = []
    let bids: number[][] = []
    const response = await fetch('https://www.bitmonedero.com/api/btc-ars')

    if (response.ok) {
      const jsonResponse: any = await response.json()

      switch (asset) {
        case 'BTC':
          asks = [[parseFloat(jsonResponse.buy_btc_ars), 1]]
          bids = [[parseFloat(jsonResponse.sell_btc_ars), 1]]
          break
        case 'USDT':
          asks = [[parseFloat(jsonResponse.buy_trxusdt_ars), 1]]
          bids = [[parseFloat(jsonResponse.sell_trxusdt_ars), 1]]
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
    console.log(error)
    return undefined
  }
}
