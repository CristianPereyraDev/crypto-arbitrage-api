import { IPair } from "src/databases/model/exchange_base.model.js"
import { IP2PPairOrders } from "src/databases/model/exchange_p2p.model.js"

export type CryptoPairWebSocketConfig = {
    volume: number
}

export type CryptoP2PWebSocketConfig = {
    pairs: IPair[]
}

export type P2PMessage = {
    p2p: { exchange: string, orders: IP2PPairOrders | null }
}