import { Server } from 'http'
import { WebSocketServer } from 'ws'
import ExchangeService, {
  ExchangesFeesType
} from '../services/exchanges.service.js'
import path from 'path'
import pug from 'pug'
import { IExchangePricingDTO } from '../types/dto/index.js'
import { getCurrencyPairRates } from '../services/currency.service.js'
import ExchangeRepositoryMongoDB from '../repository/impl/exchange-repository-mongodb.js'
import BrokerageRepositoryMongoDB from '../repository/impl/brokerage-repository-mongodb.js'
import { ExchangeP2PRepositoryMongoDB } from '../repository/impl/exchange-p2p-repository-mongodb.js'
import {
  calculateTotalAsk,
  calculateTotalBid
} from '../utils/arbitrages/arbitrage-calculator.js'
import { Request } from 'express'
import { validWebsocketToken } from '../auth/index.js'

const exchangeService = new ExchangeService(
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
)

type CryptoPairWebsocketConfig = {
  volume: number
}

/**
 *
 * @param expressServer the express http server to binding the websocket server
 * @returns
 */
export default function configure (expressServer: Server | undefined) {
  if (expressServer === undefined) return

  const wss = new WebSocketServer({ noServer: true, path: '/websocket' })
  const wssWebApp = new WebSocketServer({
    noServer: true,
    path: '/websocket/web'
  })

  expressServer.on('upgrade', (req: Request, socket, head) => {
    if (!!req.url) {
      const url = new URL(req.url, `ws://${req.headers.host}`)
      const at = url.searchParams.get('at')

      if (at && validWebsocketToken(at)) {
        if (url.pathname === '/websocket') {
          wss.handleUpgrade(req, socket, head, websocket => {
            wss.emit('connection', websocket, req)
          })
        } else if (url.pathname === '/websocket/web') {
          wssWebApp.handleUpgrade(req, socket, head, websocket => {
            wssWebApp.emit('connection', websocket, req)
          })
        } else {
          socket.destroy()
        }
      } else {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }
    }
  })

  // WebSocket server for native app
  wss.on('connection', async (websocket, connectionRequest) => {
    let exchangePricesTimeout: ReturnType<typeof setInterval>

    websocket.on('error', error => {
      console.error(
        'An error has ocurred with the websocket connection: %s',
        error
      )
      clearInterval(exchangePricesTimeout)
    })

    websocket.on('close', () => {
      console.log('The client has been closed the connection')
      clearInterval(exchangePricesTimeout)
    })

    websocket.on('message', message => {
      const parsedMessage = JSON.parse(message.toString())

      if (Object.hasOwn(parsedMessage, 'crypto')) {
        async function sendMessage () {
          const prices: IExchangePricingDTO[] =
            await exchangeService.getAllExchangesPricesBySymbol(
              parsedMessage.crypto.asset,
              parsedMessage.crypto.fiat
            )

          websocket.send(
            JSON.stringify({
              asset: parsedMessage.crypto.asset,
              fiat: parsedMessage.crypto.fiat,
              prices
            })
          )
        }

        sendMessage()

        exchangePricesTimeout = setInterval(() => {
          sendMessage()
        }, 1000 * 6)
      }
    })
  })

  // WebSocket server for the web app
  wssWebApp.on('connection', async (websocket, connectionRequest) => {
    let exchangePricesTimeout: ReturnType<typeof setInterval>
    let currencyRatesTimeout: ReturnType<typeof setInterval>
    const cryptoPairMsgConfig = new Map<string, CryptoPairWebsocketConfig>()
    let fees: ExchangesFeesType
    let includeFees = false
    exchangeService
      .getAllFees()
      .then(value => (fees = value))
      .catch(() => (fees = null))

    exchangePricesTimeout = setInterval(() => {
      cryptoPairMsgConfig.forEach((value, key) => {
        compileCryptoMessage(
          key.split('-')[0],
          key.split('-')[1],
          value.volume,
          fees,
          includeFees
        ).then(msg => websocket.send(msg))
      })
    }, 1000 * 6)

    websocket.on('error', error => {
      console.log('An error has ocurred in the websocket: %s', error)
      clearInterval(exchangePricesTimeout)
      clearInterval(currencyRatesTimeout)
    })

    websocket.on('close', () => {
      console.log('The client has been closed the connection')
      clearInterval(exchangePricesTimeout)
      clearInterval(currencyRatesTimeout)
    })

    websocket.on('message', message => {
      const parsedMessage = JSON.parse(message.toString())

      if (Object.hasOwn(parsedMessage, 'crypto')) {
        cryptoPairMsgConfig.set(
          parsedMessage.crypto.asset + '-' + parsedMessage.crypto.fiat,
          { volume: parsedMessage.crypto.volume }
        )
      } else if (Object.hasOwn(parsedMessage, 'currency')) {
        clearInterval(currencyRatesTimeout)

        compileCurrencyPairMessage(
          parsedMessage.currency.base,
          parsedMessage.currency.quote
        ).then(msg => websocket.send(msg))

        currencyRatesTimeout = setInterval(() => {
          compileCurrencyPairMessage(
            parsedMessage.currency.base,
            parsedMessage.currency.quote
          ).then(msg => websocket.send(msg))
        }, 1000 * 60)
      } else if (Object.hasOwn(parsedMessage, 'HEADERS')) {
        const headers = parsedMessage.HEADERS
        if (headers['HX-Trigger'] === 'form-settings') {
          includeFees = Object.hasOwn(parsedMessage, 'includeFees')
        }
      }
    })
  })
}

async function compileCryptoMessage (
  asset: string,
  fiat: string,
  volume: number,
  fees?: ExchangesFeesType,
  includeFees: boolean = true
) {
  const prices: IExchangePricingDTO[] =
    await exchangeService.getAllExchangesPricesBySymbol(asset, fiat, volume)
  const pricesWithFees =
    fees && includeFees
      ? prices.map(price => {
          const exchangeFees =
            fees[price.exchange.replaceAll(' ', '').toLocaleLowerCase()]

          if (exchangeFees !== undefined) {
            return {
              ...price,
              totalAsk: calculateTotalAsk({
                baseAsk: price.ask,
                fees: exchangeFees,
                includeDepositFiatFee: false
              }),
              totalBid: calculateTotalBid({
                baseBid: price.bid,
                fees: exchangeFees,
                includeWithdrawalFiatFee: false
              })
            }
          }
          return price
        })
      : prices

  const __dirname = new URL('.', import.meta.url).pathname

  const template = pug.compileFile(
    path.resolve(__dirname, '../views/symbol_prices.pug')
  )

  return template({
    asset: asset,
    fiat: fiat,
    pricesSortedByAsk: [...pricesWithFees].sort((p1, p2) =>
      p1.totalAsk && p2.totalAsk
        ? p1.totalAsk - p2.totalAsk
        : p1.totalAsk
        ? -1
        : 1
    ),
    pricesSortedByBid: [...pricesWithFees].sort((p1, p2) =>
      p1.totalBid && p2.totalBid
        ? p2.totalBid - p1.totalBid
        : p1.totalBid
        ? -1
        : 1
    )
  })
}

async function compileCurrencyPairMessage (
  currencyBase: string,
  currencyQuote: string
) {
  const rates = await getCurrencyPairRates(currencyBase, currencyQuote)

  const __dirname = new URL('.', import.meta.url).pathname

  const template = pug.compileFile(
    path.resolve(__dirname, '../views/currency_pair_prices.pug')
  )

  return template({
    currencyBase,
    currencyQuote,
    rates: rates !== undefined ? rates : []
  })
}
