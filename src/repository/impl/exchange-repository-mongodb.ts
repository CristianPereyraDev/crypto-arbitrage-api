import {
	IExchange,
	IExchangePairPrices,
} from "../../databases/model/exchange.model.js";
import { IPair } from "../../databases/model/exchange_base.model.js";
import { IExchangePricingDTO } from "../../types/dto/index.js";
import { IExchangeRepository } from "../exchange-repository.js";
import { ExchangeBaseRepository } from "../exchange-base-repository.js";
import { Exchange } from "../../databases/mongodb/schema/exchange.schema.js";
import { IExchangeFeesDTO } from "../../types/dto/index.js";
import { exchangeFeesToDTO } from "../utils/repository.utils.js";

export default class ExchangeRepositoryMongoDB
	implements ExchangeBaseRepository<IExchange>, IExchangeRepository
{
	async getExchangesFees(): Promise<{ [exchange: string]: IExchangeFeesDTO }> {
		try {
			const exchanges = await Exchange.find({}).exec();

			const fees = Object.fromEntries(
				exchanges?.map((exchange) => [
					exchange.name.toLowerCase().replaceAll(" ", ""),
					exchangeFeesToDTO(exchange),
				]),
			);

			return fees;
		} catch (error) {
			return {};
		}
	}
	async getAllAvailablePairs(): Promise<IPair[]> {
		const availablePairs: IPair[] = [];

		try {
			const exchanges = await Exchange.find({});

			for (const exchange of exchanges) {
				for (const availablePair of exchange.pricesByPair) {
					if (
						!availablePairs.some(
							(pair) =>
								pair.crypto === availablePair.crypto &&
								pair.fiat === availablePair.fiat,
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

	async updateExchangePrices(
		exchangeName: string,
		prices: IExchangePairPrices[],
	): Promise<void> {
		try {
			await Exchange.findOneAndUpdate(
				{
					name: exchangeName,
				},
				{
					$set: {
						pricesByPair: prices.map((price) => {
							return {
								crypto: price.crypto,
								fiat: price.fiat,
								asksAndBids: {
									asks: price.asksAndBids.asks,
									bids: price.asksAndBids.bids,
									createdAt: Date.now(),
								},
							};
						}),
					},
				},
			).exec();
		} catch (error) {
			console.error("An error in updateExchangePrices has ocurred: %s", error);
		}
	}

	async removeOlderPrices(): Promise<void> {
		try {
			await Exchange.updateMany(
				{},
				{
					$pull: {
						"pricesByPair.$[].asksAndBids": {
							createdAt: { $lte: new Date(Date.now() - 1000 * 60) },
						},
					},
				},
			);
		} catch (error) {
			console.error(error);
		}
	}

	async getAllPricesByPair(
		pair: IPair,
		volume: number,
	): Promise<IExchangePricingDTO[]> {
		try {
			const exchanges = await Exchange.find({
				"pricesByPair.crypto": pair.crypto,
				"pricesByPair.fiat": pair.fiat,
				available: true,
			});

			const prices = exchanges.map((exchange) => {
				// Find pair's prices for current exchange and sort
				const pairPrices = exchange.pricesByPair.find(
					(priceByPair) =>
						priceByPair.crypto === pair.crypto &&
						priceByPair.fiat === pair.fiat,
				);

				if (pairPrices !== undefined) {
					const avgAsk = this.calculateOrderBookAvgPrice(
						pairPrices.asksAndBids.asks,
						volume,
					);
					const avgBid = this.calculateOrderBookAvgPrice(
						pairPrices.asksAndBids.bids,
						volume,
					);

					return {
						exchange: exchange.name,
						exchangeType: exchange.exchangeType,
						exchangeLogoURL: exchange.logoURL,
						ask: avgAsk,
						totalAsk: avgAsk,
						bid: avgBid,
						totalBid: avgBid,
						time: 1,
					};
				}

				return {
					exchange: exchange.name,
					exchangeType: exchange.exchangeType,
					exchangeLogoURL: exchange.logoURL,
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
	getExchangeByName(name: string): Promise<IExchange> {
		throw new Error("Method not implemented.");
	}

	async getAllExchanges(): Promise<IExchange[]> {
		try {
			return await Exchange.find({ available: true });
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	calculateOrderBookAvgPrice(orders: number[][], volume: number) {
		if (orders.length <= 0) {
			return 0;
		}

		let totalQuantity = 0;
		let sum = 0;
		let i = 0;

		while (i < orders.length && totalQuantity < volume) {
			if (orders[i][1] <= volume - totalQuantity) {
				sum += orders[i][0] * orders[i][1];
				totalQuantity += orders[i][1];
			} else {
				sum += orders[i][0] * (volume - totalQuantity);
				totalQuantity = volume;
			}
			i++;
		}

		return sum / totalQuantity;
	}
}
