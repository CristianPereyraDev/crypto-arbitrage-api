import { Server } from 'http'
import { WebSocketServer } from 'ws'
import { getPricesBySymbol } from 'src/services/exchanges.service.js'
import path from 'path'
import pug from 'pug'
import { IExchangePricing } from 'src/types/exchange.js'

/**
 *
 * @param expressServer the express http server to binding the websocket server
 * @returns
 */
export default function (expressServer: Server | undefined) {
  if (expressServer === undefined) return

  const symbolPricesTemplate = pug.compileFile(
    path.join(process.cwd(), 'src', 'views', 'symbol_prices.pug')
  )

  const wss = new WebSocketServer({ noServer: true, path: '/websocket' })
  const wssWebApp = new WebSocketServer({ noServer: true, path: '/ws/web' })

  expressServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, websocket => {
      wss.emit('connection', websocket, request)
    })

    wssWebApp.handleUpgrade(request, socket, head, websocket => {
      wssWebApp.emit('connection', websocket, request)
    })
  })

  wss.on('connection', async (websocket, connectionRequest) => {
    let exchangePricesTimeout: ReturnType<typeof setInterval>

    websocket.on('error', error => {
      clearInterval(exchangePricesTimeout)
    })

    websocket.on('close', () => {
      console.log('The client has been closed the connection')
      clearInterval(exchangePricesTimeout)
    })

    websocket.on('message', message => {
      const parsedMessage = JSON.parse(message.toString())

      if (Object.hasOwn(parsedMessage, 'prices')) {
        async function sendMessage () {
          const prices: IExchangePricing[] = await getPricesBySymbol(
            parsedMessage.prices.asset,
            parsedMessage.prices.fiat
          )

          // websocket.send(
          //   symbolPricesTemplate({
          //     asset: parsedMessage.prices.asset,
          //     fiat: parsedMessage.prices.fiat,
          //     prices
          //   })
          // )
          websocket.send(
            JSON.stringify({
              asset: parsedMessage.prices.asset,
              fiat: parsedMessage.prices.fiat,
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

  wssWebApp.on('connection', async (websocket, connectionRequest) => {
    let exchangePricesTimeout: ReturnType<typeof setInterval>

    websocket.on('error', error => {
      clearInterval(exchangePricesTimeout)
    })

    websocket.on('close', () => {
      console.log('The client has been closed the connection')
      clearInterval(exchangePricesTimeout)
    })

    websocket.on('message', message => {
      const parsedMessage = JSON.parse(message.toString())

      if (Object.hasOwn(parsedMessage, 'prices')) {
        async function sendMessage () {
          const prices: IExchangePricing[] = await getPricesBySymbol(
            parsedMessage.prices.asset,
            parsedMessage.prices.fiat
          )

          websocket.send(
            symbolPricesTemplate({
              asset: parsedMessage.prices.asset,
              fiat: parsedMessage.prices.fiat,
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
}
