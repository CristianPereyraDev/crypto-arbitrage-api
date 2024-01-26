import { IPair } from 'src/databases/model/exchange_base.model.js'
import { IExchangePricingDTO } from 'src/types/dto/index.js'
import { ExchangeBaseRepository } from './exchange-base-repository.js'
import { IExchange } from 'src/databases/model/exchange.model.js'
import { ExchangeCollectorReturnType } from 'src/utils/apis/crypto_exchanges/index.js'

export interface IExchangeRepository extends ExchangeBaseRepository<IExchange> {
  getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]>

  updateExchangePrices(
    exchangeName: string,
    baseAsset: string,
    quoteAsset: string,
    prices: ExchangeCollectorReturnType
  ): Promise<void>
}
