import {
  IP2PExchange,
  IP2POrder,
  P2POrderType,
} from '../../databases/model/exchange_p2p.model.js';
import { ExchangeBaseRepository } from '../exchange-base-repository.js';
import { IExchangeP2PRepository } from '../exchange-p2p-repository.js';
import { P2PExchange } from '../../databases/mongodb/schema/exchange_p2p.schema.js';
import { IPair } from '../../databases/model/exchange_base.model.js';
import { IExchangeFees } from '../../databases/mongodb/utils/queries.util.js';

export class ExchangeP2PRepositoryMongoDB
  extends ExchangeBaseRepository<IP2PExchange>
  implements IExchangeP2PRepository
{
  async getP2POrders(exchangeName: string, pair: IPair): Promise<IP2POrder[]> {
    try {
      const result = await P2PExchange.aggregate([
        {
          $match: {
            name: exchangeName,
            available: true,
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

      return result[0].ordersByPair;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  getExchangesFees(): Promise<{ [exchange: string]: IExchangeFees }> {
    throw new Error('Method not implemented.');
  }

  getAllAvailablePairs(): Promise<IPair[]> {
    throw new Error('Method not implemented.');
  }

  async updateP2POrders(
    exchangeName: string,
    baseAsset: string,
    fiat: string,
    orderType: P2POrderType,
    orders: IP2POrder[]
  ): Promise<void> {
    try {
      let target =
        orderType === 'BUY'
          ? 'ordersByPair.$[i].buyOrders'
          : 'ordersByPair.$[i].sellOrders';

      await P2PExchange.findOneAndUpdate(
        { name: exchangeName },
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

  removeOlderPrices(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getExchangeByName(name: string): Promise<IP2PExchange> {
    throw new Error('Method not implemented.');
  }

  getAllExchanges(): Promise<IP2PExchange[]> {
    throw new Error('Method not implemented.');
  }
}
