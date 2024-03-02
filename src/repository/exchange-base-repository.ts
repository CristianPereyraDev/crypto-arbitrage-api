import { IExchangeFees } from "../databases/mongodb/utils/queries.util.js";
import { IPair } from "../databases/model/exchange_base.model.js";

export interface ExchangeBaseRepository<T> {
	getAllExchanges(projection: string[]): Promise<T[]>;
	getAllAvailablePairs(): Promise<IPair[]>;
	getExchangeByName(name: string): Promise<T | null>;
	getExchangesFees(): Promise<{
		[exchange: string]: IExchangeFees;
	}>;
}

export interface IPriceableRepository {
	removeOlderPrices(): Promise<void>;
}
