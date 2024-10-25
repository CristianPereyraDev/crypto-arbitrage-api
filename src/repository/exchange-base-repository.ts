import { IExchangeFeesDTO, IExchangePricingDTO } from '../types/dto/index.js';
import { IPair } from '../data/model/exchange_base.model.js';

export interface ExchangeBaseRepository<T> {
  getAllExchanges(projection: string[]): Promise<T[]>;
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

export interface IPriceableRepository {
  removeOlderPrices(): Promise<void>;
}
