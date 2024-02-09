import { IPair } from "src/databases/model/exchange_base.model.js"

export type CryptoPairWebSocketConfig = {
    volume: number
}

export type CryptoP2PWebSocketConfig = {
    pairs: IPair[]
}