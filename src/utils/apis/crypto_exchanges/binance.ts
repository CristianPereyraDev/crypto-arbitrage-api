import dotenv from 'dotenv'
import { RestMarketTypes, Spot } from '@binance/connector-typescript'
import { CollectorFunctionReturnType } from './index.js'

dotenv.config()

const API_KEY = process.env.BINANCE_API_KEY
const API_SECRET = process.env.BINANCE_API_SECRET
const BASE_URL = 'https://api.binance.com'

const client = new Spot(API_KEY, API_SECRET, {
  baseURL: BASE_URL,
  timeout: 3000
})

export async function getSpotAskBidPrices (
  asset: string,
  fiat: string
): Promise<CollectorFunctionReturnType | undefined> {
  const options: RestMarketTypes.orderBookOptions = {
    limit: 5
  }

  try {
    const orderBook = await client.orderBook(asset + fiat, options)

    return {
      bids: orderBook.bids.map(bid => [parseFloat(bid[0]), parseFloat(bid[1])]),
      asks: orderBook.asks.map(ask => [parseFloat(ask[0]), parseFloat(ask[1])])
    }
  } catch (error) {
    console.log('Binance API error: %s', error)
    return undefined
  }
}
