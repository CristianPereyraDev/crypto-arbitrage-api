import {
  IBrokerage,
  IBrokeragePairPrices,
} from '../../data/model/brokerage.model.js';
import { IPair } from '../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../types/dto/index.js';
import { IBrokerageRepository } from '../brokerage-repository.js';
import { ExchangeBaseRepository } from '../exchange-base-repository.js';
import { Brokerage } from '../../databases/mongodb/schema/brokerage_schema.js';
import { IExchangeFeesDTO } from '../../types/dto/index.js';
import { exchangeFeesToDTO } from '../utils/repository.utils.js';

export default class BrokerageRepositoryMongoDB
  implements ExchangeBaseRepository<IBrokerage>, IBrokerageRepository
{
  async getExchangesFees(): Promise<{ [exchange: string]: IExchangeFeesDTO }> {
    try {
      const exchanges = await Brokerage.find({}).exec();

      const fees = Object.fromEntries(
        exchanges?.map((exchange) => [
          exchange.name.toLowerCase().replaceAll(' ', ''),
          exchangeFeesToDTO(exchange),
        ])
      );

      return fees;
    } catch (error) {
      return {};
    }
  }

  async getAllAvailablePairs(): Promise<IPair[]> {
    const availablePairs: IPair[] = [];

    try {
      const exchanges = await Brokerage.find({});

      for (const exchange of exchanges) {
        for (const availablePair of exchange.pricesByPair) {
          if (
            !availablePairs.some(
              (pair) =>
                pair.crypto === availablePair.crypto &&
                pair.fiat === availablePair.fiat
            )
          ) {
            availablePairs.push(availablePair);
          }
        }
      }

      return availablePairs;
    } catch (error) {
      return [];
    }
  }

  async updateBrokeragePrices(
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

  removeOlderPrices(): Promise<void> {
    throw new Error('Method not implemented.');
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
            exchange: brokerage.name,
            exchangeType: brokerage.exchangeType,
            exchangeLogoURL: brokerage.logoURL,
            ask: pairPrices.ask,
            totalAsk: pairPrices.ask,
            bid: pairPrices.bid,
            totalBid: pairPrices.bid,
            time: 1,
          };
        }

        return {
          exchange: brokerage.name,
          exchangeType: brokerage.exchangeType,
          exchangeLogoURL: brokerage.logoURL,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getExchangeByName(name: string): Promise<IBrokerage> {
    throw new Error('Method not implemented.');
  }

  async getAllExchanges(projection: string[] = []): Promise<IBrokerage[]> {
    try {
      if (projection.length > 0) {
        return await Brokerage.find(
          { available: true },
          Object.fromEntries(projection.map((p) => [p, 1]))
        );
      }

      return await Brokerage.find({ available: true });
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
