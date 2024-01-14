import { Types } from 'mongoose'

/**
 * Ask and bids are arrays of arrays like [[price, qty], [price, qty]]
 */
export interface IAskBid {
  _id?: Types.ObjectId
  asks: number[][]
  bids: number[][]
  createdAt?: Date
}

export interface IPair {
  crypto: string
  fiat: string
}

export interface ICurrencyPairPrices extends IPair {
  asksAndBids: IAskBid[]
}

export interface INetworkFee {
  network: string
  fee: number
}

export interface ICryptoFee {
  crypto: string
  networks: INetworkFee[]
}

export interface IExchangeBase {
  name: string
  availablePairs: IPair[]
  networkFees: ICryptoFee[] // Represents crypto withdrawal fees. Deposits is supposed to be free.
  depositFiatFee: number
  withdrawalFiatFee: number
  makerFee: number
  takerFee: number
  buyFee: number
  sellFee: number
  exchangeType: string
}

// Exchange Spot like
export interface IExchange extends IExchangeBase {
  pricesByPair: ICurrencyPairPrices[]
}

// Exchange P2P
export type P2POrderType = 'BUY' | 'SELL'

export type P2PUserType = 'user' | 'merchant'

export interface IPaymentMethod {
  slug: string
  name: string
}

export interface IP2POrder {
  orderType: P2POrderType
  orderId: string
  volume: number
  price: number
  min: number
  max: number
  payments: IPaymentMethod[]
  // USER PROPERTIES //
  userType: P2PUserType
  merchantId: string
  merchantName: string
  monthOrderCount: number
  monthFinishRate: number
  positiveRate: number
  link: string
}

export interface IP2PExchange extends IExchangeBase {
  ordersByPair: {
    crypto: string
    fiat: string
    buyOrders: IP2POrder[]
    sellOrders: IP2POrder[]
  }[]
}
