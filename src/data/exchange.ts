import { IExchangePricingDTO } from './dto/index.js';

export type IExchangePairPricing = Map<string, IExchangePricingDTO>;

export interface IPairPricing {
  bids: string[][];
  asks: string[][];
}
