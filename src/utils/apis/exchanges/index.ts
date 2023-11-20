import { getPairPrices } from './argenbtc.js'
import { getSpotAskBidPrices } from './binance.js'

export type CollectorFunction = (
  baseAsset: string,
  quoteAsset: string
) => Promise<{ bids: string[][]; asks: string[][] }>

const priceCollectorFunctions = new Map<string, CollectorFunction>()

priceCollectorFunctions.set('Binance', getSpotAskBidPrices)
priceCollectorFunctions.set('ArgenBTC', getPairPrices)

export { priceCollectorFunctions }
