export interface IPair {
  crypto: string
  fiat: string
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
  slug: string
  URL: string
  logoURL: string
  availablePairs: IPair[]
  networkFees: ICryptoFee[] // Represents crypto withdrawal fees. Deposits is supposed to be free.
  depositFiatFee: number
  withdrawalFiatFee: number
  makerFee: number
  takerFee: number
  buyFee: number
  sellFee: number
  exchangeType: string
  available: boolean
}
