import { IExchangeFees } from "../databases/mongodb/utils/queries.util.js";
import { IPair } from "../databases/model/exchange_base.model.js";

export abstract class ExchangeBaseRepository<T> {
	abstract getAllExchanges(projection: string[]): Promise<T[]>;
	abstract getAllAvailablePairs(): Promise<IPair[]>;
	abstract getExchangeByName(name: string): Promise<T | null>;
	abstract getExchangesFees(): Promise<{
		[exchange: string]: IExchangeFees;
	}>;
}

export interface IPriceableRepository {
	removeOlderPrices(): Promise<void>;
}
