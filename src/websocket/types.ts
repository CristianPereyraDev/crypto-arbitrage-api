import { IPair } from "src/databases/model/exchange_base.model.js"
import { IP2POrder } from "src/databases/model/exchange_p2p.model.js"

export type CryptoPairWebSocketConfig = {
    volume: number
}

export type CryptoP2PWebSocketConfig = {
    pairs: IPair[]
}

export type P2PWebSocketMessage = {
    p2p: {
        exchange: string,
        crypto: string,
        fiat: string,
        buyOrders: IP2POrder[],
        sellOrders: IP2POrder[]
    }
}