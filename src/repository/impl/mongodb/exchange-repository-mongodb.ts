import { IExchangePairPrices } from '../../../data/model/exchange.model.js';
import { IPair } from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import { IExchangeRepository } from '../../exchange-repository.js';
import { Exchange } from '../../../databases/mongodb/schema/exchange.schema.js';
import { calculateOrderBookAvgPrice } from '../../../exchanges/operations/exchange-utils.js';

export default class ExchangeRepositoryMongoDB implements IExchangeRepository {
  async updatePrices(
    exchangeSlugName: string,
    prices: IExchangePairPrices[]
  ): Promise<void> {
    try {
      await Exchange.findOneAndUpdate(
        {
          slug: exchangeSlugName,
        },
        {
          $set: {
            pricesByPair: prices.map((price) => {
              return {
                crypto: price.crypto,
                fiat: price.fiat,
                asksAndBids: {
                  asks: price.asksAndBids.asks,
                  bids: price.asksAndBids.bids,
                  createdAt: Date.now(),
                },
              };
            }),
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
      const exchanges = await Exchange.find({
        'pricesByPair.crypto': pair.crypto,
        'pricesByPair.fiat': pair.fiat,
        available: true,
      });

      const prices = exchanges.map((exchange) => {
        // Find pair's prices for current exchange and sort
        const pairPrices = exchange.pricesByPair.find(
          (priceByPair) =>
            priceByPair.crypto === pair.crypto && priceByPair.fiat === pair.fiat
        );

        if (pairPrices !== undefined) {
          const avgAsk = calculateOrderBookAvgPrice(
            pairPrices.asksAndBids.asks,
            volume
          );
          const avgBid = calculateOrderBookAvgPrice(
            pairPrices.asksAndBids.bids,
            volume
          );

          return {
            exchangeSlug: exchange.slug,
            pair,
            exchangeType: exchange.exchangeType,
            ask: avgAsk,
            bid: avgBid,
            time: 1,
          } satisfies IExchangePricingDTO;
        }

        return {
          exchangeSlug: exchange.slug,
          pair,
          exchangeType: exchange.exchangeType,
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
