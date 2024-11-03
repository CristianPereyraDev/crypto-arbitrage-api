import { Schema, Repository } from 'redis-om';

import { IExchangePairPrices } from '../../../data/model/exchange.model.js';
import {
  ExchangeType,
  IPair,
} from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import { IExchangeRepository } from '../../exchange-repository.js';
import { calculateOrderBookAvgPrice } from '../../../exchanges/operations/exchange-utils.js';
import { RedisType } from '../../../databases/redis/redis-client.js';

const exchangeSchema = new Schema('exchange', {
  exchange: { type: 'string' },
  exchangeType: { type: 'string' },
  pair: { type: 'string' },
  asks: { type: 'string[]' },
  bids: { type: 'string[]' },
});

export default class ExchangeRepositoryRedis implements IExchangeRepository {
  redis: RedisType;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  repository: Repository<Record<string, any>>;

  constructor(redis: RedisType) {
    this.redis = redis;
    this.repository = new Repository(exchangeSchema, this.redis);
    this.repository.createIndex();
  }

  async updatePrices(
    exchangeSlugName: string,
    prices: IExchangePairPrices[]
  ): Promise<void> {
    try {
      await Promise.allSettled(
        prices.map((price) =>
          this.repository.save(
            `${exchangeSlugName}${price.crypto}${price.fiat}`,
            {
              exchange: exchangeSlugName,
              exchangeType: ExchangeType.Exchange,
              pair: `${price.crypto}-${price.fiat}`,
              asks: price.asksAndBids.asks.map((askEntry) =>
                JSON.stringify(askEntry.map((v) => v.toString()))
              ),
              bids: price.asksAndBids.bids.map((bidEntry) =>
                JSON.stringify(bidEntry.map((v) => v.toString()))
              ),
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
        .equals(ExchangeType.Exchange)
        .and('pair')
        .equals(`${pair.crypto}-${pair.fiat}`)
        .return.all();

      const prices = exchanges.map((exchange) => {
        const askOrders = (exchange.asks as string[]).map((ask) =>
          (JSON.parse(ask) as string[]).map((v) => Number(v))
        );
        const avgAsk = calculateOrderBookAvgPrice(askOrders, volume);

        const bidOrders = (exchange.bids as string[]).map((bid) =>
          (JSON.parse(bid) as string[]).map((v) => Number(v))
        );
        const avgBid = calculateOrderBookAvgPrice(bidOrders, volume);

        return {
          exchangeSlug: exchange.exchange,
          pair,
          exchangeType: ExchangeType.Exchange,
          ask: avgAsk,
          bid: avgBid,
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
