import { IPair } from 'src/databases/model/exchange_base.model.js'
import { IExchangePricingDTO } from 'src/types/dto/index.js'

export interface IBrokerageRepository {
  getAllPricesByPair(pair: IPair): Promise<IExchangePricingDTO[]>
  updateBrokeragePrices(
    exchangeName: string,
    baseAsset: string,
    quoteAsset: string,
    ask: number,
    bid: number
  ): Promise<void>
}
