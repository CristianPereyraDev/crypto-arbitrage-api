import { Server } from 'http'
import { WebSocketServer } from 'ws'
import { Request } from 'express'
import { validWebsocketToken } from '../auth/index.js'
import { wsWebConnectionHandler } from './connection_handlers/web_app_connection_handler.js'
import { wsNativeConnectionHandler } from './connection_handlers/native_app_connection_handler.js'


/**
 *
 * @param expressServer the express http server to binding the websocket server
 * @returns
 */
export default function configure(expressServer: Server | undefined) {
  if (expressServer === undefined) return

  const wss = new WebSocketServer({ noServer: true, path: '/websocket' })
  const wssWebApp = new WebSocketServer({
    noServer: true,
    path: '/websocket/web'
  })

  expressServer.on('upgrade', (req: Request, socket, head) => {
    if (req.url) {
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

  // WebSocket connection handler for native app
  wss.on('connection', wsNativeConnectionHandler)

  // WebSocket connection handler for the web app
  wssWebApp.on('connection', wsWebConnectionHandler)
}
