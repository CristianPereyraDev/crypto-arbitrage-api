import jwt from 'jsonwebtoken'

export function validWebsocketToken (token: string) {
  const secret = process.env.WEBSOCKET_SECRET

  try {
    return !!jwt.verify(token, secret || '')
  } catch (error) {
    return false
  }
}
