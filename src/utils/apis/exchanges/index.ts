import * as argenbtc from './argenbtc.js'
import * as binance from './binance.js'
import * as binancep2p from './p2p/binance.js'
import { getBitgetPairPrices } from './p2p/bitget.js'
import * as bitmonedero from './bitmonedero.js'
import * as cryptomarket from './cryptomarket.js'
import * as ripiotrade from './ripiotrade.js'
import * as saldo from './saldo.js'
import * as trubit from './trubit.js'
import * as bitso from './bitso.js'
import * as pluscrypto from './pluscrypto.js'
import * as bybit from './bybit.js'
import * as fiwind from './fiwind.js'
import * as tiendacrypto from './tiendacrypto.js'
import * as satoshitango from './satoshitango.js'
import {
  IP2POrder,
  P2POrderType
} from 'src/databases/mongodb/model/exchange.model.js'

/**
 * bids & asks are arrays like -> [[price, qty], [price, qty], ...]
 */
export type CollectorFunctionReturnType = {
  bids: number[][]
  asks: number[][]
}

export type CollectorFunctionType = (
  baseAsset: string,
  quoteAsset: string
) => Promise<CollectorFunctionReturnType | undefined>

export type P2PCollectorFunctionType = (
  asset: string,
  fiat: string,
  tradeType: P2POrderType
) => Promise<IP2POrder[] | undefined>

const priceCollectors = new Map<string, CollectorFunctionType>()
const p2pOrderCollectors = new Map<string, P2PCollectorFunctionType>()

// priceCollectors.set('Binance', binance.getSpotAskBidPrices) // Implemented
// priceCollectors.set('ArgenBTC', argenbtc.getPairPrices) // Implemented
// priceCollectors.set('Bitmonedero', bitmonedero.getPairPrices) // Implemented
// priceCollectors.set('Bitget', getBitgetPairPrices) // Not implemented
// priceCollectors.set('CryptoMarket', cryptomarket.getPairPrices) // Implemented
// priceCollectors.set('Ripio Trade', ripiotrade.getPairPrices) // Implemented
// priceCollectors.set('Saldo', saldo.getPairPrices) // Implemented
// priceCollectors.set('TruBit', trubit.getPairPrices) // Implemented
// priceCollectors.set('Bitso', bitso.getPairPrices) // Implemented
// priceCollectors.set('Plus Crypto', pluscrypto.getPairPrices) // Implemented
// priceCollectors.set('Fiwind', fiwind.getPairPrices) // Implemented
// priceCollectors.set('TiendaCrypto', tiendacrypto.getPairPrices) // Implemented
// priceCollectors.set('satoshitango', satoshitango.getPairPrices) // Implemented
//bybit.getPairPrices()

// P2P Exchange collectors
p2pOrderCollectors.set('Binance P2P', binancep2p.getP2POrders)

export { priceCollectors as priceCollectorFunctions }
