import { getPairPrices } from './argenbtc.js'
import { getSpotAskBidPrices } from './binance.js'
import { getBitgetPairPrices } from './p2p/bitget.js'
import * as bitmonedero from './bitmonedero.js'
import * as cryptomarket from './cryptomarket.js'

export type CollectorFunction = (
  baseAsset: string,
  quoteAsset: string
) => Promise<{ bids: string[][]; asks: string[][] } | undefined>

const priceCollectorFunctions = new Map<string, CollectorFunction>()

// priceCollectorFunctions.set('Binance', getSpotAskBidPrices)
// priceCollectorFunctions.set('ArgenBTC', getPairPrices)
// priceCollectorFunctions.set('Bitmonedero', bitmonedero.getPairPrices)
// priceCollectorFunctions.set('Bitget', getBitgetPairPrices)
priceCollectorFunctions.set('CryptoMarket', cryptomarket.getPairPrices)

export { priceCollectorFunctions }
