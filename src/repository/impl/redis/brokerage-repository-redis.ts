import { Schema, Repository } from 'redis-om';

import { IBrokeragePairPrices } from '../../../data/model/brokerage.model.js';
import {
  ExchangeType,
  IPair,
} from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import { IBrokerageRepository } from '../../brokerage-repository.js';
import { RedisType } from '../../../databases/redis/redis-client.js';

const brokerageSchema = new Schema('brokerage', {
  exchange: { type: 'string' },
  exchangeType: { type: 'string' },
  pair: { type: 'string' },
  ask: { type: 'string' },
  bid: { type: 'string' },
});

export default class BrokerageRepositoryRedis implements IBrokerageRepository {
  redis: RedisType;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  repository: Repository<Record<string, any>>;

  constructor(redis: RedisType) {
    this.redis = redis;
    this.repository = new Repository(brokerageSchema, this.redis);
    this.repository.createIndex();
  }

  async updatePrices(
    exchangeSlugName: string,
    prices: IBrokeragePairPrices[]
  ): Promise<void> {
    try {
      await Promise.allSettled(
        prices.map((price) =>
          this.repository.save(
            `${exchangeSlugName}${price.crypto}${price.fiat}`,
            {
              exchange: exchangeSlugName,
              exchangeType: ExchangeType.Brokerage,
              pair: `${price.crypto}-${price.fiat}`,
              ask: price.ask.toString(),
              bid: price.bid.toString(),
            }
          )
        )
      );
    } catch (error) {
      console.error('An error in updateExchangePrices has ocurred: %s', error);
    }
  }

  async getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    try {
      const exchanges = await this.repository
        .search()
        .where('exchangeType')
        .equals(ExchangeType.Brokerage)
        .and('pair')
        .equals(`${pair.crypto}-${pair.fiat}`)
        .return.all();

      const prices = exchanges.map((exchange) => {
        return {
          exchangeSlug: exchange.exchange,
          pair,
          exchangeType: ExchangeType.Brokerage,
          ask: Number(exchange.ask),
          bid: Number(exchange.bid),
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
