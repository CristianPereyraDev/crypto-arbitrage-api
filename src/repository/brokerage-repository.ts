import { IPair } from '../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../types/dto/index.js';
import {
  ExchangeBaseRepository,
  IPriceableRepository,
} from './exchange-base-repository.js';
import {
  IBrokerage,
  IBrokeragePairPrices,
} from '../data/model/brokerage.model.js';

export interface IBrokerageRepository
  extends ExchangeBaseRepository<IBrokerage>,
    IPriceableRepository {
  updateBrokeragePrices(
    slugName: string,
    prices: IBrokeragePairPrices[]
  ): Promise<void>;
}
