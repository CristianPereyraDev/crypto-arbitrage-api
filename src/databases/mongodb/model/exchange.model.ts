/**
 * Ask and bids are arrays of arrays like [[price, qty], [price, qty]]
 */
export interface IAskBid {
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
export interface IP2PExchange extends IExchangeBase {
  orders: IP2POrder[]
}

export interface IP2POrder {
  orderId: string
  merchantId: string
  merchantName: string
  volume: number
  price: number
  min: number
  max: number
  trades: number
  completed: number
  payments: string[][]
  verified: boolean
  link: string
}
