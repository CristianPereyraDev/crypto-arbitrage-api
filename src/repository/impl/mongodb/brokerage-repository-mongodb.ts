import { IBrokeragePairPrices } from '../../../data/model/brokerage.model.js';
import { IPair } from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import { IBrokerageRepository } from '../../brokerage-repository.js';
import { Brokerage } from '../../../databases/mongodb/schema/brokerage_schema.js';

export default class BrokerageRepositoryMongoDB
  implements IBrokerageRepository
{
  async updatePrices(
    slugName: string,
    prices: IBrokeragePairPrices[]
  ): Promise<void> {
    try {
      await Brokerage.findOneAndUpdate(
        {
          slug: slugName,
        },
        {
          $set: {
            pricesByPair: prices,
          },
        }
      ).exec();
    } catch (error) {
      console.error('An error in updateExchangePrices has ocurred: %s', error);
    }
  }

  async getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    try {
      const brokerages = await Brokerage.find({
        'pricesByPair.crypto': pair.crypto,
        'pricesByPair.fiat': pair.fiat,
        available: true,
      });

      const prices = brokerages.map((brokerage) => {
        // Find pair's prices for current exchange and sort
        const pairPrices = brokerage.pricesByPair.find(
          (priceByPair) =>
            priceByPair.crypto === pair.crypto && priceByPair.fiat === pair.fiat
        );

        if (pairPrices !== undefined) {
          return {
            exchangeSlug: brokerage.slug,
            pair,
            exchangeType: brokerage.exchangeType,
            ask: pairPrices.ask,
            bid: pairPrices.bid,
            time: 1,
          } satisfies IExchangePricingDTO;
        }

        return {
          exchangeSlug: brokerage.slug,
          pair,
          exchangeType: brokerage.exchangeType,
          ask: 0,
          bid: 0,
          time: 1,
        } satisfies IExchangePricingDTO;
      });

      return prices;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
