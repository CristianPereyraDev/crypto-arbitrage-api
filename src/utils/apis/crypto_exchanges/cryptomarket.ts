import { IPair } from "../../../databases/model/exchange_base.model.js";
import { IExchangePairPrices } from "../../../databases/model/exchange.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { OrderBookLevel } from "cryptomarket/lib/models.js";
import {
	Client,
	CryptomarketAPIException,
	CryptomarketSDKException,
} from "cryptomarket/lib/index.js";
import { APIError } from "../../../types/errors/index.js";

const apiKey = process.env.CRYPTOMARKET_API_KEY ?? "";
const apiSecret = process.env.CRYPTOMARKET_API_SECRET ?? "";
const client = new Client(apiKey, apiSecret);

export type CryptoMarketAPIOrderBookResponse = {
	timestamp: string;
	ask: [[number, number]];
	bid: [[number, number]];
};

export type CryptoMarketAPIRateResponse = {
	[asset: string]: {
		currency: string;
		price: string;
		timestamp: string;
	};
};

export async function existSymbol(
	baseCurrency: string,
	quoteCurrency: string,
): Promise<boolean> {
	try {
		const symbol = await client.getSymbol(baseCurrency + quoteCurrency);

		if (symbol.description) {
			return true;
		}

		return false;
	} catch (error) {
		throw new Error("Error has occurred when intent to get symbol data");
	}
}

export async function fetchRate(
	from: string,
	to: string,
): Promise<CryptoMarketAPIRateResponse> {
	try {
		const response = await fetchWithTimeout(
			`https://api.exchange.cryptomkt.com/api/3/public/price/rate?from=${from}&to=${to}`,
		);

		if (response.ok) {
			return (await response.json()) as CryptoMarketAPIRateResponse;
		}

		throw new Error(`${response.status}: ${response.statusText}`);
	} catch (error) {
		throw new Error(`${error}`);
	}
}

function calculate(entries: OrderBookLevel[]): number {
	const result = [0, 1];

	for (const [price] of entries) {
		result[0] += Number(price);
	}

	return result[0] / entries.length;
}

export async function calculatePricesFromOrderBook(
	asset: string,
	quote: string,
): Promise<[number, number]> {
	try {
		const orderBook = await client.getOrderBookVolume({
			symbol: asset + quote,
			volume: 0.1,
		});

		return [calculate(orderBook.ask), calculate(orderBook.bid)];
	} catch (error) {
		throw new Error(`${error}`);
	}
}

export async function getPairPrices(
	pairs: IPair[],
): Promise<IExchangePairPrices[]> {
	try {
		const btcarsTicker = await client.getTicker("BTCARS");
		return await Promise.all(
			pairs.map(
				(pair) =>
					new Promise<IExchangePairPrices>((resolve, reject) => {
						if (pair.crypto === "BTC") {
							client
								.getOrderBook(pair.crypto + pair.fiat)
								.then((orderBook) => {
									resolve({
										crypto: pair.crypto,
										fiat: pair.fiat,
										asksAndBids: { asks: orderBook.ask, bids: orderBook.bid },
									});
								})
								.catch((reason) => reject(reason));
						} else {
							client
								.getTicker(`BTC${pair.crypto}`)
								.then((ticker) => {
									resolve({
										crypto: pair.crypto,
										fiat: pair.fiat,
										asksAndBids: {
											asks: [
												[Number(btcarsTicker.ask) / Number(ticker.ask), 1],
											],
											bids: [
												[Number(btcarsTicker.bid) / Number(ticker.bid), 1],
											],
										},
									});
								})
								.catch((reason) => reject(reason));
						}
					}),
			),
		);
	} catch (error) {
		if (
			!(
				error instanceof CryptomarketSDKException ||
				error instanceof CryptomarketAPIException
			)
		) {
			throw new APIError(client.apiUrl, "CryptoMarket API", "unknown");
		}

		throw error;
	}
}
