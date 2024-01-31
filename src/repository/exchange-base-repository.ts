import { IPair } from '../databases/model/exchange_base.model.js'

export abstract class ExchangeBaseRepository<T> {
  abstract getAllAvailablePairs(): Promise<IPair[]>
  abstract removeOlderPrices(): Promise<void>
  abstract getExchangeByName(name: string): Promise<T>
  abstract getAllExchanges(): Promise<T[]>
}
