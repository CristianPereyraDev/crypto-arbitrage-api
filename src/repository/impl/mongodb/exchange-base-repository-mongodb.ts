import {
  ExchangeType,
  IExchangeBase,
  IPair,
} from '../../../data/model/exchange_base.model.js';
import { ExchangeBaseRepository } from '../../exchange-base-repository.js';
import {
  IExchangeFeesDTO,
  IExchangePricingDTO,
} from '../../../data/dto/index.js';
import { ExchangeBase } from '../../../databases/mongodb/schema/exchange_base.schema.js';
import { DatabaseError } from '../../../data/errors/index.js';
import { exchangeFeesToDTO } from '../../utils/repository.utils.js';
import { FilterQuery } from 'mongoose';

export class ExchangeBaseRepositoryMongoBD
  implements ExchangeBaseRepository<IExchangeBase>
{
  async getAllAvailablePairs(): Promise<IPair[]> {
    try {
      const allExchanges = await ExchangeBase.find({ available: true });
      let allPairs: IPair[] = [];

      for (const exchange of allExchanges) {
        allPairs = allPairs.concat(exchange.availablePairs);
      }

      return allPairs.filter(
        (outerPair, index) =>
          allPairs.findIndex(
            (pair) =>
              pair.crypto === outerPair.crypto && pair.fiat === outerPair.fiat
          ) === index
      );
    } catch (error) {
      throw new DatabaseError('Error on ExchangeBase.find() operation.');
    }
  }

  async getExchangeByName(name: string): Promise<IExchangeBase | null> {
    try {
      const exchange = await ExchangeBase.findOne({ name });

      if (exchange) {
        return exchange;
      }

      return null;
    } catch (error) {
      throw new DatabaseError('Error on ExchangeBase.findOne() operation.');
    }
  }

  async getAllExchanges(
    projection: string[] = [],
    exchangeType?: ExchangeType,
    onlyAvailable?: boolean
  ): Promise<IExchangeBase[]> {
    const filter: FilterQuery<IExchangeBase> = {};
    if (exchangeType) {
      filter.exchangeType = exchangeType;
    }
    if (onlyAvailable !== undefined) {
      filter.available = onlyAvailable;
    }

    try {
      if (projection.length > 0) {
        // Find with projection option for exclude unnecessary properties
        return await ExchangeBase.find(
          filter,
          Object.fromEntries(projection.map((p) => [p, 1]))
        ).lean();
      }

      return await ExchangeBase.find(filter);
    } catch (error) {
      throw new DatabaseError('Error on ExchangeBase.find() operation.');
    }
  }

  async getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    throw new Error('Method not implemented.');
  }

  async getExchangesFees(): Promise<{ [exchange: string]: IExchangeFeesDTO }> {
    try {
      const exchanges = await ExchangeBase.find({}).exec();

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
}
