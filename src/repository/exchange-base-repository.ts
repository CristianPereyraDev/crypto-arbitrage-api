import { IPair } from 'src/databases/model/exchange_base.model.js'
import { ExchangeBase } from 'src/databases/mongodb/schema/exchange_base.schema.js'

export abstract class ExchangeBaseRepository<T> {
  /**
   * Get all available pairs in all exchanges
   */
  async getAllAvailablePairs (): Promise<IPair[]> {
    const availablePairs: IPair[] = []

    try {
      const exchanges = await ExchangeBase.find({})

      for (let exchange of exchanges) {
        for (let availablePair of exchange.availablePairs) {
          if (
            !availablePairs.some(
              pair =>
                pair.crypto === availablePair.crypto &&
                pair.fiat === availablePair.fiat
            )
          ) {
            availablePairs.push(availablePair)
          }
        }
      }

      return availablePairs
    } catch (error) {
      return []
    }
  }

  abstract removeOlderPrices(): Promise<void>
  abstract getExchangeByName(name: string): Promise<T>
  abstract getAllExchanges(): Promise<T[]>
}
