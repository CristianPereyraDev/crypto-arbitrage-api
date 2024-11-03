import { IExchangePricingRepository } from './exchange-base-repository.js';
import { IExchangePairPrices } from '../data/model/exchange.model.js';

export interface IExchangeRepository extends IExchangePricingRepository {
  updatePrices(
    exchangeSlugName: string,
    prices: IExchangePairPrices[]
  ): Promise<void>;
}
