import { IPair } from '../../data/model/exchange_base.model.js';

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
  name: string;
  slug: string;
  URL: string;
  logoURL: string;
  exchangeType: string;
  available: boolean;
  availablePairs: IPair[];
  fees: IExchangeFeesDTO;
}

export interface IExchangePricingDTO {
  exchange: string;
  exchangeType: string;
  exchangeLogoURL: string;
  ask: number;
  bid: number;
  time: number;
}
