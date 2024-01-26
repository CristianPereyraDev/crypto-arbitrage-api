import { IPair } from 'src/databases/model/exchange_base.model.js'
import { IExchangePricingDTO } from 'src/types/dto/index.js'
import { ExchangeBaseRepository } from './exchange-base-repository.js'
import { IBrokerage } from 'src/databases/model/brokerage.model.js'

export interface IBrokerageRepository
  extends ExchangeBaseRepository<IBrokerage> {
  getAllPricesByPair(pair: IPair): Promise<IExchangePricingDTO[]>
  updateBrokeragePrices(
    exchangeName: string,
    baseAsset: string,
    quoteAsset: string,
    ask: number,
    bid: number
  ): Promise<void>
}
