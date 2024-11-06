import { Schema, Repository } from 'redis-om';

import {
  ExchangeType,
  IPair,
} from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import {
  IP2POrder,
  IP2PPairOrders,
} from '../../../data/model/exchange_p2p.model.js';
import { IExchangeP2PRepository } from '../../exchange-p2p-repository.js';
import { calculateOrderBookAvgPrice } from '../../../exchanges/operations/exchange-utils.js';
import { RedisType } from '../../../databases/redis/redis-client.js';

const exchangeP2PSchema = new Schema('exchangeP2P', {
  exchangeSlug: { type: 'string' },
  exchangeType: { type: 'string' },
  pair: { type: 'string' },
  sellOrders: { type: 'string[]' },
  buyOrders: { type: 'string[]' },
});

export class ExchangeP2PRepositoryRedis implements IExchangeP2PRepository {
  redis: RedisType;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  repository: Repository<Record<string, any>>;

  constructor(redis: RedisType) {
    this.redis = redis;
    this.repository = new Repository(exchangeP2PSchema, this.redis);
    this.repository.createIndex();
  }

  async getP2POrders(
    exchangeSlug: string,
    pair: IPair
  ): Promise<IP2PPairOrders> {
    const p2pExchange = await this.repository.fetch(
      `${exchangeSlug}${pair.crypto}${pair.fiat}`
    );

    if (
      p2pExchange.buyOrders !== undefined &&
      p2pExchange.sellOrders !== undefined
    ) {
      return {
        ...pair,
        buyOrders: (p2pExchange.buyOrders as string[]).map((strOrder) =>
          JSON.parse(strOrder)
        ),
        sellOrders: (p2pExchange.sellOrders as string[]).map((strOrder) =>
          JSON.parse(strOrder)
        ),
      };
    }

    return { ...pair, buyOrders: [], sellOrders: [] };
  }

  async updateP2POrders(
    exchangeSlug: string,
    baseAsset: string,
    fiat: string,
    sellOrders: IP2POrder[],
    buyOrders: IP2POrder[]
  ): Promise<void> {
    await this.repository.save(`${exchangeSlug}${baseAsset}${fiat}`, {
      exchangeSlug: exchangeSlug,
      exchangeType: ExchangeType.P2PExchange,
      pair: `${baseAsset}-${fiat}`,
      sellOrders: sellOrders.map((order) => JSON.stringify(order)),
      buyOrders: buyOrders.map((order) => JSON.stringify(order)),
    });
  }

  async getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    try {
      const searchResult = await this.repository
        .search()
        .where('exchangeType')
        .equals(ExchangeType.P2PExchange)
        .and('pair')
        .equals(`${pair.crypto}-${pair.fiat}`)
        .return.all();
      const prices: IExchangePricingDTO[] = [];

      for (const entity of searchResult) {
        const buyOrders: IP2POrder[] = (entity.buyOrders as string[]).map(
          (strOrder) => JSON.parse(strOrder)
        );
        const sellOrders: IP2POrder[] = (entity.sellOrders as string[]).map(
          (strOrder) => JSON.parse(strOrder)
        );
        const avgAsk = calculateOrderBookAvgPrice(
          sellOrders.map((p2pOrder) => [p2pOrder.price, p2pOrder.volume]),
          volume
        );
        const avgBid = calculateOrderBookAvgPrice(
          buyOrders.map((p2pOrder) => [p2pOrder.price, p2pOrder.volume]),
          volume
        );

        prices.push({
          exchangeSlug: entity.exchangeSlug,
          pair,
          exchangeType: ExchangeType.P2PExchange,
          ask: avgAsk,
          bid: avgBid,
          time: 0,
        } satisfies IExchangePricingDTO);
      }

      return prices;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
