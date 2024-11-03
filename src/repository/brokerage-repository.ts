import { IExchangePricingRepository } from './exchange-base-repository.js';
import { IBrokeragePairPrices } from '../data/model/brokerage.model.js';

export interface IBrokerageRepository extends IExchangePricingRepository {
  updatePrices(slugName: string, prices: IBrokeragePairPrices[]): Promise<void>;
}
