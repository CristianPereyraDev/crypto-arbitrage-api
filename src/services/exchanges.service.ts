import { IExchangePricingDTO } from '../types/dto/index.js'
import {
  IP2POrder,
  P2POrderType
} from '../databases/model/exchange_p2p.model.js'
import { IPair } from '../databases/model/exchange_base.model.js'
import { ExchangeCollectorReturnType } from '../utils/apis/crypto_exchanges/index.js'
import { IExchangeRepository } from '../repository/exchange-repository.js'
import { IBrokerageRepository } from '../repository/brokerage-repository.js'
import { IExchangeP2PRepository } from '../repository/exchange-p2p-repository.js'

export default class ExchangeService {
  constructor (
    private readonly exchangeRepository: IExchangeRepository,
    private readonly brokerageRepository: IBrokerageRepository,
    private readonly exchangeP2PRepository: IExchangeP2PRepository
  ) {}

  async updateP2POrders (
    exchangeName: string,
    baseAsset: string,
    fiat: string,
    orderType: P2POrderType,
    orders: IP2POrder[]
  ) {
    this.exchangeP2PRepository.updateP2POrders(
      exchangeName,
      baseAsset,
      fiat,
      orderType,
      orders
    )
  }

  async updateBrokeragePrices (
    exchangeName: string,
    baseAsset: string,
    quoteAsset: string,
    ask: number,
    bid: number
  ) {
    this.brokerageRepository.updateBrokeragePrices(
      exchangeName,
      baseAsset,
      quoteAsset,
      ask,
      bid
    )
  }

  async updateExchangePrices (
    exchangeName: string,
    baseAsset: string,
    quoteAsset: string,
    prices: ExchangeCollectorReturnType
  ) {
    this.exchangeRepository.updateExchangePrices(
      exchangeName,
      baseAsset,
      quoteAsset,
      prices
    )
  }

  async removeOlderPrices () {
    this.exchangeRepository.removeOlderPrices()
  }

  async getAvailablePairs (): Promise<IPair[]> {
    const exchangesPairs = await this.exchangeRepository.getAllAvailablePairs()
    const brokeragePairs = await this.brokerageRepository.getAllAvailablePairs()
    const allPairs = exchangesPairs.concat(brokeragePairs)
    return allPairs.filter(
      (outerPair, index) =>
        allPairs.findIndex(
          pair =>
            pair.crypto === outerPair.crypto && pair.fiat === outerPair.fiat
        ) === index
    )
  }

  async getAllExchangesPricesBySymbol (
    asset: string,
    fiat: string,
    volume: number = 1.0
  ): Promise<IExchangePricingDTO[]> {
    const prices = await Promise.all([
      this.brokerageRepository.getAllPricesByPair({ crypto: asset, fiat }),
      this.exchangeRepository.getAllPricesByPair(
        { crypto: asset, fiat },
        volume
      )
    ])

    return prices.flat()
  }

  async getAvailableExchanges () {
    return this.exchangeRepository.getAllExchanges()
  }

  async getAvailableBrokerages () {
    return this.brokerageRepository.getAllExchanges()
  }
}
