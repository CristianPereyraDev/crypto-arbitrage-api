import { IPair } from "../databases/model/exchange_base.model.js";
import { IExchangePricingDTO } from "../types/dto/index.js";
import {
	ExchangeBaseRepository,
	IPriceableRepository,
} from "./exchange-base-repository.js";
import { IExchange } from "../databases/model/exchange.model.js";
import { ExchangeCollectorReturnType } from "../utils/apis/crypto_exchanges/index.js";

export interface IExchangeRepository
	extends ExchangeBaseRepository<IExchange>,
		IPriceableRepository {
	getAllPricesByPair(
		pair: IPair,
		volume: number,
	): Promise<IExchangePricingDTO[]>;

	updateExchangePrices(
		exchangeName: string,
		baseAsset: string,
		quoteAsset: string,
		prices: ExchangeCollectorReturnType,
	): Promise<void>;
}
