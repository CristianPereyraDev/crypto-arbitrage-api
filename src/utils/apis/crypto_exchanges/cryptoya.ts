import { APIError } from "../../../types/errors/index.js";
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
): Promise<IBrokeragePairPrices[]> {
	try {
		return await Promise.all<IBrokeragePairPrices>(
			pairs.map(
				(pair) =>
					new Promise((resolve, reject) => {
						const endpoint = `https://criptoya.com/api/${exchange}/${pair.crypto}/${pair.fiat}`;
						fetchWithTimeout(endpoint)
							.then((response) => {
								if (!response.ok) {
									throw new APIError(
										endpoint,
										"Criptoya",
										`${response.status} - ${response.statusText}`,
									);
								}
								return response.json();
							})
							.then((jsonResponse) => {
								const data = jsonResponse as CryptoYaAPIResponseType;

								resolve({
									crypto: pair.crypto,
									fiat: pair.fiat,
									ask: data.ask,
									bid: data.bid,
								});
							})
							.catch((reason) => reject(reason));
					}),
			),
		);
	} catch (error) {
		if (!(error instanceof APIError)) {
			throw new Error(
				`There was a problem with the Fetch operation to Saldo API: ${error}`,
			);
		}

		throw error;
	}
}
