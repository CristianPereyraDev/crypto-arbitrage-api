import dotenv from 'dotenv'
import {
  RestMarketTypes,
  RestTradeTypes,
  Spot
} from '@binance/connector-typescript'
import { IExchangePricing, IPairPricing } from 'types/exchange.js'

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
): Promise<IPairPricing> {
  const options: RestMarketTypes.orderBookOptions = {
    limit: 5
  }

  try {
    const orderBook = await client.orderBook(asset + fiat, options)

    return { bids: orderBook.bids, asks: orderBook.asks }
  } catch (error) {
    //console.log(asset + fiat, error)
    return { bids: [], asks: [] }
  }
}

export interface IP2POrder {
  adv: {
    price: number
    maxSingleTransAmount: number
    minSingleTransAmount: number
  }
  advertiser: { nickName: string; userType: 'merchant' | 'user' | null }
}

export async function getP2POrders (
  asset: string,
  fiat: string,
  tradeType: string
): Promise<IP2POrder[]> {
  const data = {
    fiat: fiat,
    page: 1,
    rows: 10,
    tradeType: tradeType,
    asset: asset,
    countries: [],
    proMerchantAds: false,
    shieldMerchantAds: false,
    publisherType: null,
    payTypes: [],
    classifies: ['mass', 'profession']
  }
  try {
    const response = await fetch(
      `https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )

    if (response.ok) {
      const jsonResponse = await response.json()
      const formatedResponse: IP2POrder[] = jsonResponse.data.map(
        (order: IP2POrder) => {
          return {
            adv: {
              price: order.adv.price,
              maxSingleTransAmount: order.adv.maxSingleTransAmount,
              minSingleTransAmount: order.adv.minSingleTransAmount
            },
            advertiser: {
              nickName: order.advertiser.nickName,
              userType: order.advertiser.userType
            }
          }
        }
      )

      return formatedResponse
    } else {
      console.log('Status code=', response.status)
      return []
    }
  } catch (error) {
    console.log('Error on fetch to p2p')
    return []
  }
}

export async function getP2PAskBidPrices (
  asset: string,
  fiat: string,
  volume: number
): Promise<IExchangePricing> {
  try {
    const askOrders = await getP2POrders(asset, fiat, 'BUY')
    const bidOrders = await getP2POrders(asset, fiat, 'SELL')

    return {
      ask: askOrders[0].adv.price,
      totalAsk: askOrders[0].adv.price,
      bid: bidOrders[0].adv.price,
      totalBid: bidOrders[0].adv.price,
      time: 0
    }
  } catch (error) {
    return { ask: 0, totalAsk: 0, bid: 0, totalBid: 0, time: 0 }
  }
}
