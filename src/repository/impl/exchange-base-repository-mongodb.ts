import {
	IExchangeBase,
	IPair,
} from "../../databases/model/exchange_base.model.js";
import { ExchangeBaseRepository } from "../exchange-base-repository.js";
import { IExchangeFeesDTO } from "../../types/dto/index.js";
import { ExchangeBase } from "../../databases/mongodb/schema/exchange_base.schema.js";
import { DatabaseError } from "../../types/errors/index.js";

export class ExchangeBaseRepositoryMongoBD
	implements ExchangeBaseRepository<IExchangeBase>
{
	getExchangesFees(): Promise<{ [exchange: string]: IExchangeFeesDTO }> {
		throw new Error("Method not implemented.");
	}

	getAllAvailablePairs(): Promise<IPair[]> {
		throw new Error("Method not implemented.");
	}

	async getExchangeByName(name: string): Promise<IExchangeBase | null> {
		try {
			const exchange = await ExchangeBase.findOne({ name });

			if (exchange) {
				return exchange;
			}

			return null;
		} catch (error) {
			throw new DatabaseError("Error on ExchangeBase.findOne() operation.");
		}
	}

	async getAllExchanges(projection: string[] = []): Promise<IExchangeBase[]> {
		try {
			if (projection.length > 0) {
				// Find with projection option for exclude unnecessary properties
				return await ExchangeBase.find(
					{ available: true },
					Object.fromEntries(projection.map((p) => [p, 1])),
				).lean();
			}

			return await ExchangeBase.find({ available: true });
		} catch (error) {
			throw new DatabaseError("Error on ExchangeBase.find() operation.");
		}
	}
}
