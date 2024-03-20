import { IExchangePairPrices } from "../../../databases/model/exchange.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";
import { APIError } from "../../../types/errors/index.js";

type TrueBitOrderbookResponse = {
	time: number;
	asks: [[string, string]];
	bids: [[string, string]];
};

export async function getPairPrices(
	pairs: IPair[],
): Promise<IExchangePairPrices[]> {
	return await Promise.all<IExchangePairPrices>(
		pairs.map((pair) => {
			return new Promise((resolve, reject) => {
				const endpoint = `https://api.mexo.io/openapi/quote/v1/option/depth?symbol=${pair.crypto}${pair.fiat}`;
				fetchWithTimeout(endpoint)
					.then((apiResponse) => {
						if (!apiResponse.ok) {
							throw new APIError(
								endpoint,
								"Trubit",
								`${apiResponse.status} - ${apiResponse.statusText}`,
							);
						}

						return apiResponse.json();
					})
					.then((apiResponseJson) => {
						const data = apiResponseJson as TrueBitOrderbookResponse;

						resolve({
							crypto: pair.crypto,
							fiat: pair.fiat,
							asksAndBids: {
								asks: data.asks.map((ask) => [
									parseFloat(ask[0]),
									parseFloat(ask[1]),
								]),
								bids: data.bids.map((bid) => [
									parseFloat(bid[0]),
									parseFloat(bid[1]),
								]),
							},
						});
					})
					.catch((reason) => reject(reason));
			});
		}),
	);
}
