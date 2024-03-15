import { IPair } from "../databases/model/exchange_base.model.js";
import { IExchangePricingDTO } from "../types/dto/index.js";
import {
	ExchangeBaseRepository,
	IPriceableRepository,
} from "./exchange-base-repository.js";
import {
	IExchange,
	IExchangePairPrices,
} from "../databases/model/exchange.model.js";

export interface IExchangeRepository
	extends ExchangeBaseRepository<IExchange>,
		IPriceableRepository {
	getAllPricesByPair(
		pair: IPair,
		volume: number,
	): Promise<IExchangePricingDTO[]>;

	updateExchangePrices(
		exchangeName: string,
		prices: IExchangePairPrices[],
	): Promise<void>;
}
