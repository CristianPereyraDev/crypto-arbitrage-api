import dotenv from "dotenv";
import { RestMarketTypes, Spot } from "@binance/connector-typescript";

import { IPair } from "../../../databases/model/exchange_base.model.js";
import { IExchangePairPrices } from "../../../databases/model/exchange.model.js";
import { APIError } from "../../../types/errors/index.js";

dotenv.config();

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;
const BASE_URL = "https://api.binance.com";

const client = new Spot(API_KEY, API_SECRET, {
	baseURL: BASE_URL,
	timeout: 3000,
});

interface orderBookResponse {
	lastUpdateId: number;
	bids: string[][];
	asks: string[][];
}

export async function getSpotAskBidPrices(
	pairs: IPair[],
): Promise<IExchangePairPrices[]> {
	const options: RestMarketTypes.orderBookOptions = {
		limit: Number(process.env.ORDER_BOOK_LIMIT) ?? 10,
	};

	try {
		const orderBooks = await Promise.allSettled(
			pairs.map(
				(pair) =>
					new Promise<orderBookResponse & { pair: IPair }>(
						(resolve, reject) => {
							client
								.orderBook(pair.crypto + pair.fiat, options)
								.then((orderBook) => resolve({ ...orderBook, pair }))
								.catch((reason) =>
									reject(
										new APIError(
											client.baseURL,
											"Binance",
											`There was an error with the pair ${pair.crypto}-${pair.fiat}: ${reason}`,
										),
									),
								);
						},
					),
			),
		);

		return orderBooks.map((result) => {
			if (result.status === "fulfilled") {
				return {
					crypto: result.value.pair.crypto,
					fiat: result.value.pair.fiat,
					asksAndBids: {
						asks: result.value.asks.map((ask) => [
							parseFloat(ask[0]),
							parseFloat(ask[1]),
						]),
						bids: result.value.bids.map((bid) => [
							parseFloat(bid[0]),
							parseFloat(bid[1]),
						]),
					},
				};
			}

			console.error(result.reason);

			return {
				crypto: result.reason.pair.crypto,
				fiat: result.reason.pair.fiat,
				asksAndBids: { asks: [], bids: [] },
			};
		});
	} catch (error) {
		throw new APIError(client.baseURL, "Binance API", "unknown");
	}
}
