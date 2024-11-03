import {
  IP2POrder,
  IP2PPairOrders,
  P2POrderType,
} from '../../../data/model/exchange_p2p.model.js';
import { IExchangeP2PRepository } from '../../exchange-p2p-repository.js';
import { P2PExchange } from '../../../databases/mongodb/schema/exchange_p2p.schema.js';
import { IPair } from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import { calculateOrderBookAvgPrice } from '../../../exchanges/operations/exchange-utils.js';

export class ExchangeP2PRepositoryMongoDB implements IExchangeP2PRepository {
  async getP2POrders(
    exchangeName: string,
    pair: IPair
  ): Promise<IP2PPairOrders | null> {
    try {
      const result = await P2PExchange.aggregate([
        {
          $match: {
            name: exchangeName,
            available: true,
            exchangeType: 'P2PExchange',
          },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            ordersByPair: {
              $filter: {
                input: '$ordersByPair',
                as: 'pair',
                cond: {
                  $and: [
                    {
                      $eq: ['$$pair.crypto', pair.crypto],
                    },
                    {
                      $eq: ['$$pair.fiat', pair.fiat],
                    },
                  ],
                },
                limit: 1,
              },
            },
          },
        },
      ]);

      return result[0].ordersByPair[0];
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async updateP2POrders(
    exchangeSlugName: string,
    baseAsset: string,
    fiat: string,
    sellOrders: IP2POrder[],
    buyOrders: IP2POrder[]
  ): Promise<void> {
    try {
      const buyTarget = 'ordersByPair.$[i].buyOrders';
      const sellTarget = 'ordersByPair.$[i].sellOrders';

      await P2PExchange.findOneAndUpdate(
        { slug: exchangeSlugName },
        { $set: { [buyTarget]: buyOrders, [sellTarget]: sellOrders } },
        {
          arrayFilters: [
            {
              'i.crypto': baseAsset,
              'i.fiat': fiat,
            },
          ],
        }
      );
    } catch (error) {
      console.error('An error in updateP2POrders has ocurred: %s', error);
    }
  }

  async getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    try {
      const exchangesP2P = await P2PExchange.find({
        'ordersByPair.crypto': pair.crypto,
        'ordersByPair.fiat': pair.fiat,
        available: true,
      });

      const prices = exchangesP2P.map((exchangeP2P) => {
        // Find pair's prices for current exchange and sort
        const pairPrices = exchangeP2P.ordersByPair.find(
          (orderByPair) =>
            orderByPair.crypto === pair.crypto && orderByPair.fiat === pair.fiat
        );

        if (pairPrices !== undefined) {
          const avgAsk = calculateOrderBookAvgPrice(
            pairPrices.sellOrders.map((p2pOrder) => [
              p2pOrder.price,
              p2pOrder.volume,
            ]),
            volume
          );
          const avgBid = calculateOrderBookAvgPrice(
            pairPrices.buyOrders.map((p2pOrder) => [
              p2pOrder.price,
              p2pOrder.volume,
            ]),
            volume
          );

          return {
            exchange: exchangeP2P.name,
            exchangeType: exchangeP2P.exchangeType,
            exchangeLogoURL: exchangeP2P.logoURL,
            ask: avgAsk,
            totalAsk: avgAsk,
            bid: avgBid,
            totalBid: avgBid,
            time: 1,
          };
        }

        return {
          exchange: exchangeP2P.name,
          exchangeType: exchangeP2P.exchangeType,
          exchangeLogoURL: exchangeP2P.logoURL,
          ask: 0,
          totalAsk: 0,
          bid: 0,
          totalBid: 0,
          time: 1,
        };
      });

      return prices;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
