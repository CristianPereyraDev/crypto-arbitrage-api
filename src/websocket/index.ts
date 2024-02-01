import { Server } from 'http'
import { WebSocketServer } from 'ws'
import ExchangeService from '../services/exchanges.service.js'
import path from 'path'
import pug from 'pug'
import { IExchangePricingDTO } from '../types/dto/index.js'
import { getCurrencyPairRates } from '../services/currency.service.js'
import ExchangeRepositoryMongoDB from '../repository/impl/exchange-repository-mongodb.js'
import BrokerageRepositoryMongoDB from '../repository/impl/brokerage-repository-mongodb.js'
import { ExchangeP2PRepositoryMongoDB } from '../repository/impl/exchange-p2p-repository-mongodb.js'
import { val } from 'node_modules/cheerio/lib/api/attributes.js'

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
export default function (expressServer: Server | undefined) {
  if (expressServer === undefined) return

  const wss = new WebSocketServer({ noServer: true, path: '/websocket' })
  const wssWebApp = new WebSocketServer({
    noServer: true,
    path: '/websocket/web'
  })

  expressServer.on('upgrade', (request, socket, head) => {
    if (request.url !== undefined) {
      const pathname = request.url

      if (pathname === '/websocket') {
        wss.handleUpgrade(request, socket, head, websocket => {
          wss.emit('connection', websocket, request)
        })
      } else if (pathname === '/websocket/web') {
        wssWebApp.handleUpgrade(request, socket, head, websocket => {
          wssWebApp.emit('connection', websocket, request)
        })
      } else {
        socket.destroy()
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

    exchangePricesTimeout = setInterval(() => {
      cryptoPairMsgConfig.forEach((value, key) => {
        compileCryptoMessage(
          key.split('-')[0],
          key.split('-')[1],
          value.volume
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
      }
    })
  })
}

async function compileCryptoMessage (
  asset: string,
  fiat: string,
  volume: number
) {
  const prices: IExchangePricingDTO[] =
    await exchangeService.getAllExchangesPricesBySymbol(asset, fiat, volume)

  const __dirname = new URL('.', import.meta.url).pathname

  const template = pug.compileFile(
    path.resolve(__dirname, '../views/symbol_prices.pug')
  )

  return template({
    asset: asset,
    fiat: fiat,
    pricesSortedByAsk: [...prices].sort((p1, p2) =>
      p1.totalAsk && p2.totalAsk
        ? p1.totalAsk - p2.totalAsk
        : p1.totalAsk
        ? -1
        : 1
    ),
    pricesSortedByBid: [...prices].sort((p1, p2) =>
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
