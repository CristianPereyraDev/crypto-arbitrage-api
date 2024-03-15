import { IPair } from "../databases/model/exchange_base.model.js";
import { IExchangePricingDTO } from "../types/dto/index.js";
import {
	ExchangeBaseRepository,
	IPriceableRepository,
} from "./exchange-base-repository.js";
import {
	IBrokerage,
	IBrokeragePairPrices,
} from "../databases/model/brokerage.model.js";

export interface IBrokerageRepository
	extends ExchangeBaseRepository<IBrokerage>,
		IPriceableRepository {
	getAllPricesByPair(pair: IPair): Promise<IExchangePricingDTO[]>;
	updateBrokeragePrices(
		exchangeName: string,
		prices: IBrokeragePairPrices[],
	): Promise<void>;
}
