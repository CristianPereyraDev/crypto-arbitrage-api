import {
  ExchangeBaseRepository,
  IPriceableRepository,
} from './exchange-base-repository.js';
import {
  IExchange,
  IExchangePairPrices,
} from '../data/model/exchange.model.js';

export interface IExchangeRepository
  extends ExchangeBaseRepository<IExchange>,
    IPriceableRepository {
  updateExchangePrices(
    exchangeSlugName: string,
    prices: IExchangePairPrices[]
  ): Promise<void>;
}
