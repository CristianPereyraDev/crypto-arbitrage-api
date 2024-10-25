import {
  IP2PExchange,
  IP2POrder,
  IP2PPairOrders,
  P2POrderType,
} from '../../data/model/exchange_p2p.model.js';
import { ExchangeBaseRepository } from '../exchange-base-repository.js';
import { IExchangeP2PRepository } from '../exchange-p2p-repository.js';
import { P2PExchange } from '../../databases/mongodb/schema/exchange_p2p.schema.js';
import { IPair } from '../../data/model/exchange_base.model.js';
import {
  IExchangeFeesDTO,
  IExchangePricingDTO,
} from '../../types/dto/index.js';
import { calculateOrderBookAvgPrice } from './exchange-repository-mongodb.js';

export class ExchangeP2PRepositoryMongoDB
  implements ExchangeBaseRepository<IP2PExchange>, IExchangeP2PRepository
{
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
    orderType: P2POrderType,
    orders: IP2POrder[]
  ): Promise<void> {
    try {
      const target =
        orderType === 'BUY'
          ? 'ordersByPair.$[i].buyOrders'
          : 'ordersByPair.$[i].sellOrders';

      await P2PExchange.findOneAndUpdate(
        { slug: exchangeSlugName },
        { $set: { [target]: orders } },
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

  getExchangesFees(): Promise<{ [exchange: string]: IExchangeFeesDTO }> {
    throw new Error('Method not implemented.');
  }

  getAllAvailablePairs(): Promise<IPair[]> {
    throw new Error('Method not implemented.');
  }

  removeOlderPrices(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getExchangeByName(name: string): Promise<IP2PExchange> {
    throw new Error('Method not implemented.');
  }

  getAllExchanges(): Promise<IP2PExchange[]> {
    throw new Error('Method not implemented.');
  }
}
