import { IExchange } from "../../databases/model/exchange.model.js";
import { IPair } from "../../databases/model/exchange_base.model.js";
import { IExchangePricingDTO } from "../../types/dto/index.js";
import { IExchangeRepository } from "../exchange-repository.js";
import { ExchangeBaseRepository } from "../exchange-base-repository.js";
import { Exchange } from "../../databases/mongodb/schema/exchange.schema.js";
import { ExchangeCollectorReturnType } from "../../utils/apis/crypto_exchanges/index.js";
import { IExchangeFeesDTO } from "../../types/dto/index.js";

export default class ExchangeRepositoryMongoDB
	implements ExchangeBaseRepository<IExchange>, IExchangeRepository
{
	async getExchangesFees(): Promise<{ [exchange: string]: IExchangeFeesDTO }> {
		try {
			const exchanges = await Exchange.find({}).exec();

			const fees = Object.fromEntries(
				exchanges?.map((exchange) => [
					exchange.name.toLowerCase().replaceAll(" ", ""),
					Object.fromEntries([
						["depositFiatFee", exchange.depositFiatFee],
						["withdrawalFiatFee", exchange.withdrawalFiatFee],
						["makerFee", exchange.makerFee],
						["takerFee", exchange.takerFee],
						[
							"networkFees",
							Object.fromEntries(
								exchange.networkFees.map((cryptoFee) => [
									cryptoFee.crypto,
									Object.fromEntries(
										cryptoFee.networks.map((network) => [
											network.network,
											network.fee,
										]),
									),
								]),
							),
						],
						["buyFee", exchange.buyFee],
						["sellFee", exchange.sellFee],
					]) as IExchangeFeesDTO,
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
		baseAsset: string,
		quoteAsset: string,
		prices: ExchangeCollectorReturnType,
	): Promise<void> {
		try {
			await Exchange.findOneAndUpdate(
				{
					name: exchangeName,
				},
				{
					$push: {
						"pricesByPair.$[i].asksAndBids": {
							asks: prices.asks,
							bids: prices.bids,
							createdAt: Date.now(),
						},
					},
				},
				{
					arrayFilters: [
						{
							"i.crypto": baseAsset,
							"i.fiat": quoteAsset,
						},
					],
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
				const pairPrices = exchange.pricesByPair
					.find(
						(priceByPair) =>
							priceByPair.crypto === pair.crypto &&
							priceByPair.fiat === pair.fiat,
					)
					?.asksAndBids.sort((pricingA, pricingB) =>
						pricingA.createdAt !== undefined && pricingB.createdAt !== undefined
							? pricingA.createdAt?.getTime() - pricingB.createdAt?.getTime()
							: 0,
					);

				if (pairPrices !== undefined && pairPrices.length > 0) {
					const avgAsk = this.calculateOrderBookAvgPrice(
						pairPrices[0].asks,
						volume,
					);
					const avgBid = this.calculateOrderBookAvgPrice(
						pairPrices[0].bids,
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

	private calculateOrderBookAvgPrice(orders: number[][], volume: number) {
		const avg = [0, volume];
		let i = 0;

		while (i < orders.length && avg[1] > 0) {
			if (avg[1] > orders[i][1]) {
				avg[0] += orders[i][0] * orders[i][1];
				avg[1] -= orders[i][1];
			} else {
				avg[0] += orders[i][0] * avg[1];
				avg[1] = 0;
			}
			i++;
		}

		return avg[0] / volume;
	}
}
