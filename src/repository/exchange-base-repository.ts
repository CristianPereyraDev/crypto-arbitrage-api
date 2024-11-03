import { IExchangeFeesDTO, IExchangePricingDTO } from '../data/dto/index.js';
import { ExchangeType, IPair } from '../data/model/exchange_base.model.js';

export interface ExchangeBaseRepository<T> {
  getAllExchanges(
    projection: string[],
    exchangeType?: ExchangeType,
    onlyAvailable?: boolean
  ): Promise<T[]>;

  getAllAvailablePairs(): Promise<IPair[]>;

  getExchangeByName(name: string): Promise<T | null>;

  getExchangesFees(): Promise<{
    [exchange: string]: IExchangeFeesDTO;
  }>;

  getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]>;
}

export interface IExchangePricingRepository {
  getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]>;
}
