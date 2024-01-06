import { Exchange } from '../../databases/mongodb/schema/exchange.schema.js'
import CryptoArbitrageModel from '../../databases/mongodb/schema/arbitrage.schema.js'
import { pricesByCurrencyPair } from '../apis/exchanges/cryptoya.js'
import {
  ICryptoArbitrageResult,
  calculateArbitragesFromPairData
} from '../arbitrage-calculator.js'
import { priceCollectorFunctions } from '../apis/exchanges/index.js'
import { ICurrencyPairPrices } from 'src/databases/mongodb/model/exchange.model.js'
import { ExchangeP2P } from 'src/databases/mongodb/schema/exchange_p2p.schema.js'

export const currencyPairs = [
  { crypto: 'MATIC', fiat: 'ARS' },
  { crypto: 'BTC', fiat: 'ARS' },
  { crypto: 'ETH', fiat: 'ARS' },
  { crypto: 'USDT', fiat: 'ARS' },
  { crypto: 'MANA', fiat: 'ARS' }
]

export async function collectArbitragesToDB (): Promise<void> {
  for (const pair of currencyPairs) {
    try {
      const prices = await pricesByCurrencyPair(pair.crypto, pair.fiat, 0.1)
      const arbitrageResult = await calculateArbitragesFromPairData(prices)

      for (let arbitrage of arbitrageResult) {
        let doc = new CryptoArbitrageModel({
          cryptocurrency: pair.crypto,
          fiat: pair.fiat,
          askExchange: arbitrage.askExchange,
          askPrice: arbitrage.askPrice,
          bidExchange: arbitrage.bidExchange,
          bidPrice: arbitrage.bidPrice,
          profit: arbitrage.profit,
          time: arbitrage.time
        })

        await doc.save()
      }
    } catch (error) {
      //console.log(error)
      continue
    }
  }
}

export async function collectArbitrages (
  crypto: string,
  fiat: string,
  volume: number
): Promise<ICryptoArbitrageResult[]> {
  try {
    const prices = await pricesByCurrencyPair(crypto, fiat, volume)
    const arbitrageResult = await calculateArbitragesFromPairData(prices)

    return arbitrageResult
  } catch (error) {
    //console.log(error)
    return []
  }
}

async function collectExchangePrices (
  exchangeName: string,
  crypto: string,
  fiat: string
) {
  try {
    const priceCollector = priceCollectorFunctions.get(exchangeName)

    if (priceCollector !== undefined) {
      const askBids = await priceCollector(crypto, fiat)

      if (askBids !== undefined) {
        const asks: Array<[number, number]> = askBids.asks.map(ask => [
          parseFloat(ask[0]),
          parseFloat(ask[1])
        ])
        const bids: Array<[number, number]> = askBids.bids.map(ask => [
          parseFloat(ask[0]),
          parseFloat(ask[1])
        ])

        return { asks, bids }
      }
    }
    return undefined
  } catch (error) {
    console.log('Error in collectExchangesPricesToBD', error)
    return undefined
  }
}

export async function collectExchangesPricesToBD () {
  try {
    const exchanges = await Exchange.find({})
    const exchangesP2P = await ExchangeP2P.find({})

    for (let exchange of exchanges) {
      if (exchange.availablePairs.length > 0) {
        for (let availablePair of exchange.availablePairs) {
          const collectedPrices = await collectExchangePrices(
            exchange.name,
            availablePair.crypto,
            availablePair.fiat
          )

          if (collectedPrices !== undefined) {
            const pair: ICurrencyPairPrices | undefined =
              exchange.pricesByPair.find(
                price =>
                  price.crypto === availablePair.crypto &&
                  price.fiat === availablePair.fiat
              )
            if (pair !== undefined) {
              pair.asksAndBids.push({
                asks: collectedPrices.asks,
                bids: collectedPrices.bids
              })
            } else {
              exchange.pricesByPair.push({
                crypto: availablePair.crypto,
                fiat: availablePair.fiat,
                asksAndBids: [
                  { asks: collectedPrices.asks, bids: collectedPrices.bids }
                ]
              })
            }

            await exchange.save()
          }
        }
      }
    }
  } catch (error) {
    console.log('Error en collectExchangesPricesToBD', error)
  }
}
