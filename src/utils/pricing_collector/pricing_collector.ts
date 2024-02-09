import CryptoArbitrageModel from '../../databases/mongodb/schema/arbitrage.schema.js'
import { getBrokeragePairPrices } from '../apis/crypto_exchanges/cryptoya.js'
import {
  ICryptoArbitrageResult,
  calculateArbitragesFromPairData
} from '../arbitrages/arbitrage-calculator.js'
import {
  BrokerageCollectorReturnType,
  ExchangeCollectorReturnType,
  p2pOrderCollectors,
  exchangePriceCollectors,
  brokeragePriceCollectors
} from '../apis/crypto_exchanges/index.js'
import ExchangeService from '../../services/exchanges.service.js'
import { P2PExchange } from '../../databases/mongodb/schema/exchange_p2p.schema.js'
import { currencyPriceCollectors } from '../apis/currency_exchanges/index.js'
import { updateCurrencyPairRate } from '../../services/currency.service.js'
import ExchangeRepositoryMongoDB from '../../repository/impl/exchange-repository-mongodb.js'
import BrokerageRepositoryMongoDB from '../../repository/impl/brokerage-repository-mongodb.js'
import { ExchangeP2PRepositoryMongoDB } from '../../repository/impl/exchange-p2p-repository-mongodb.js'
import { IExchange } from '../../databases/model/exchange.model.js'

export const currencyPairs = [
  { crypto: 'MATIC', fiat: 'ARS' },
  { crypto: 'BTC', fiat: 'ARS' },
  { crypto: 'ETH', fiat: 'ARS' },
  { crypto: 'USDT', fiat: 'ARS' },
  { crypto: 'MANA', fiat: 'ARS' }
]

const exchangeService = new ExchangeService(
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
)

// Crypto exchanges prices (USDT-ARS, BTC-ARS, ...)

export async function collectArbitragesToDB(): Promise<void> {
  // for (const pair of currencyPairs) {
  //   try {
  //     const prices = await getBrokeragePairPrices(pair.crypto, pair.fiat, 0.1)
  //     const arbitrageResult = await calculateArbitragesFromPairData(prices)
  //     for (let arbitrage of arbitrageResult) {
  //       let doc = new CryptoArbitrageModel({
  //         cryptocurrency: pair.crypto,
  //         fiat: pair.fiat,
  //         askExchange: arbitrage.askExchange,
  //         askPrice: arbitrage.askPrice,
  //         bidExchange: arbitrage.bidExchange,
  //         bidPrice: arbitrage.bidPrice,
  //         profit: arbitrage.profit,
  //         time: arbitrage.time
  //       })
  //       await doc.save()
  //     }
  //   } catch (error) {
  //     console.log(error)
  //     continue
  //   }
  // }
}

export async function collectArbitrages(
  crypto: string,
  fiat: string,
  volume: number
): Promise<ICryptoArbitrageResult[]> {
  // try {
  //   const prices = await getBrokeragePairPrices(crypto, fiat, volume)
  //   const arbitrageResult = await calculateArbitragesFromPairData(prices)

  //   return arbitrageResult
  // } catch (error) {
  //   //console.log(error)
  //   return []
  // }
  return []
}

export async function collectP2POrdersToDB() {
  try {
    const p2pExchanges = await P2PExchange.find({ available: true })

    for (let p2pExchange of p2pExchanges) {
      const orderCollector = p2pOrderCollectors.get(p2pExchange.name)

      if (orderCollector !== undefined) {
        for (let p2pPair of p2pExchange.ordersByPair) {
          orderCollector(p2pPair.crypto, p2pPair.fiat, 'BUY').then(orders => {
            if (orders !== undefined) {
              exchangeService.updateP2POrders(
                p2pExchange.name,
                p2pPair.crypto,
                p2pPair.fiat,
                'BUY',
                orders
              )
            }
          })
          orderCollector(p2pPair.crypto, p2pPair.fiat, 'SELL').then(orders => {
            if (orders !== undefined) {
              exchangeService.updateP2POrders(
                p2pExchange.name,
                p2pPair.crypto,
                p2pPair.fiat,
                'SELL',
                orders
              )
            }
          })
        }
      }
    }
  } catch (error) {
    console.log('Error en collectP2POrdersToBD', error)
  }
}

type PromiseAllElemResultType = {
  exchangeName: string
  baseAsset: string
  quoteAsset: string
  prices: ExchangeCollectorReturnType | undefined
}

export async function collectCryptoExchangesPricesToDB() {
  try {
    const exchanges: IExchange[] = await exchangeService.getAvailableExchanges()
    const collectors: Promise<PromiseAllElemResultType>[] = []

    for (let exchange of exchanges) {
      const priceCollector = exchangePriceCollectors.get(exchange.name)
      if (priceCollector === undefined) continue

      for (let pair of exchange.pricesByPair) {
        collectors.push(
          new Promise<PromiseAllElemResultType>((resolve, _reject) => {
            priceCollector(pair.crypto, pair.fiat).then(prices => {
              resolve({
                exchangeName: exchange.name,
                baseAsset: pair.crypto,
                quoteAsset: pair.fiat,
                prices
              })
            })
          })
        )
      }
    }

    // Call collectors in parallel
    const priceCollectorResults = await Promise.all(collectors)
    for (let priceCollectorResult of priceCollectorResults) {
      if (priceCollectorResult.prices !== undefined) {
        exchangeService.updateExchangePrices(
          priceCollectorResult.exchangeName,
          priceCollectorResult.baseAsset,
          priceCollectorResult.quoteAsset,
          priceCollectorResult.prices
        )
      }
    }
  } catch (error) {
    console.log('Error en collectExchangesPricesToBD', error)
  }
}

type BrokeragePromiseAllElemResultType = {
  exchangeName: string
  baseAsset: string
  quoteAsset: string
  prices: BrokerageCollectorReturnType | undefined
}

export async function collectCryptoBrokeragesPricesToDB() {
  try {
    const exchanges = await exchangeService.getAvailableBrokerages()
    const collectors: Promise<BrokeragePromiseAllElemResultType>[] = []

    for (let exchange of exchanges) {
      const priceCollector = brokeragePriceCollectors.get(exchange.name)
      if (priceCollector === undefined) continue

      for (let pair of exchange.pricesByPair) {
        collectors.push(
          new Promise<BrokeragePromiseAllElemResultType>((resolve, _reject) => {
            priceCollector(pair.crypto, pair.fiat).then(prices => {
              resolve({
                exchangeName: exchange.name,
                baseAsset: pair.crypto,
                quoteAsset: pair.fiat,
                prices
              })
            })
          })
        )
      }
    }

    // Call collectors in parallel
    const priceCollectorResults = await Promise.all(collectors)
    for (let priceCollectorResult of priceCollectorResults) {
      if (priceCollectorResult.prices !== undefined) {
        exchangeService.updateBrokeragePrices(
          priceCollectorResult.exchangeName,
          priceCollectorResult.baseAsset,
          priceCollectorResult.quoteAsset,
          priceCollectorResult.prices.ask,
          priceCollectorResult.prices.bid
        )
      }
    }
  } catch (error) {
    console.log('Error en collectExchangesPricesToBD', error)
  }
}

// Currency exchanges prices (USD-ARS, USD-EUR, ...)

export async function collectCurrencyExchangesPricesToDB() {
  currencyPriceCollectors.forEach((collector, symbol) => {
    const [currencyBase, currencyQuote] = symbol.split('-')
    collector().then(rates => {
      if (rates !== undefined) {
        updateCurrencyPairRate(currencyBase, currencyQuote, rates)
      }
    })
  })
}
