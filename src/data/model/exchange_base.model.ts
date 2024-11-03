export interface IPair {
  crypto: string;
  fiat: string;
}

export interface INetworkFee {
  network: string;
  fee: number;
}

export interface ICryptoFee {
  crypto: string;
  networks: INetworkFee[];
}

export interface IExchangeFees {
  depositFiatFee: number;
  withdrawalFiatFee: number;
  makerFee: number;
  takerFee: number;
  buyFee: number;
  sellFee: number;
  networkFees: ICryptoFee[]; // Represents crypto withdrawal fees. Deposits is supposed to be free.
}

export enum ExchangeType {
  Exchange = 'Exchange',
  P2PExchange = 'P2PExchange',
  Brokerage = 'Brokerage',
}

export interface IExchangeBase extends IExchangeFees {
  name: string;
  slug: string;
  URL: string;
  logoURL: string;
  availablePairs: IPair[];
  exchangeType: ExchangeType;
  available: boolean;
}
