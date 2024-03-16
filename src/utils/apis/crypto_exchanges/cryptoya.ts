import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";

type CryptoYaAPIResponseType = {
	ask: number;
	totalAsk: number;
	bid: number;
	totalBid: number;
	time: number;
};

export async function getBrokeragePairPrices(
	pairs: IPair[],
	exchange: string,
): Promise<IBrokeragePairPrices[] | undefined> {
	try {
		return await Promise.all<IBrokeragePairPrices>(
			pairs.map(
				(pair) =>
					new Promise((resolve) => {
						fetchWithTimeout(
							`https://criptoya.com/api/${exchange}/${pair.crypto}/${pair.fiat}`,
						)
							.then((response) => {
								response.json().then((jsonResponse) => {
									const data = jsonResponse as CryptoYaAPIResponseType;

									resolve({
										crypto: pair.crypto,
										fiat: pair.fiat,
										ask: data.ask,
										bid: data.bid,
									});
								});
							})
							.catch(() =>
								resolve({
									crypto: pair.crypto,
									fiat: pair.fiat,
									ask: 0,
									bid: 0,
								}),
							);
					}),
			),
		);
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
