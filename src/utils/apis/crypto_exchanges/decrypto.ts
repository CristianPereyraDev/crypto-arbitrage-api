import WebSocket from 'ws'

const ws = new WebSocket('wss://api.decrypto.la/websocket/prices/arg')

ws.on('error', console.error)

ws.on('open', () => {
  console.log('Websocket connection to decrypto is open')
})

ws.on('message', data => {
  console.log('received: %s', data)
})
