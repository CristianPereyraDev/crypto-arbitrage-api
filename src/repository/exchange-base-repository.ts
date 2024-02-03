import { IExchangeFees } from 'src/databases/mongodb/utils/queries.util.js'
import { IPair } from '../databases/model/exchange_base.model.js'

export abstract class ExchangeBaseRepository<T> {
  abstract getExchangesFees(): Promise<{
    [exchange: string]: IExchangeFees
  }>
  abstract getAllAvailablePairs(): Promise<IPair[]>
  abstract removeOlderPrices(): Promise<void>
  abstract getExchangeByName(name: string): Promise<T>
  abstract getAllExchanges(): Promise<T[]>
}
