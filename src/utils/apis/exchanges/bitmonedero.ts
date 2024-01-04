import { IPairPricing } from '../../../types/exchange.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<IPairPricing> {
  try {
    let asks: string[][] = []
    let bids: string[][] = []
    const response = await fetch('https://www.bitmonedero.com/api/btc-ars')

    if (response.ok) {
      const jsonResponse: any = await response.json()

      switch (asset) {
        case 'BTC':
          asks = [[jsonResponse.buy_btc_ars, '1']]
          bids = [[jsonResponse.sell_btc_ars, '1']]
          break
        case 'USDT':
          asks = [[jsonResponse.buy_trxusdt_ars, '1']]
          bids = [[jsonResponse.sell_trxusdt_ars, '1']]
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
