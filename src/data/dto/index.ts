import { ExchangeType, IPair } from '../model/exchange_base.model.js';

export type NetworkFees = { [crypto: string]: { [network: string]: number } };

export interface IExchangeFeesDTO {
  depositFiatFee: number;
  withdrawalFiatFee: number;
  makerFee: number;
  takerFee: number;
  buyFee: number;
  sellFee: number;
  networkFees: NetworkFees;
}

export interface IExchangeBaseDTO {
  exchangeName: string;
  exchangeSlug: string;
  URL: string;
  logoURL: string;
  exchangeType: string;
  available: boolean;
  availablePairs: IPair[];
}

export interface IExchangeBaseWithFeesDTO extends IExchangeBaseDTO {
  fees: IExchangeFeesDTO;
}

export interface IExchangePricingDTO {
  exchangeSlug: string;
  pair: IPair;
  exchangeType: ExchangeType;
  ask: number;
  bid: number;
  time: number;
}

export interface IExchangePricingTotalDTO extends IExchangePricingDTO {
  totalAsk: number;
  totalBid: number;
}

export type ExchangePricingCompletedDTO = IExchangeBaseDTO &
  IExchangePricingDTO;
