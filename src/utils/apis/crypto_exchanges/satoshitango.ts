import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";
import { APIError } from "../../../types/errors/index.js";

type SatoshiTangoData = {
	[baseAsset: string]: {
		date: string;
		timestamp: number;
		bid: number;
		ask: number;
		high: number;
		low: number;
		volume: number;
		change: number;
	};
};

type SatoshiTangoAPIResponse = {
	data: { ticker: SatoshiTangoData; code: string };
};

const apiBaseURL = "https://api.satoshitango.com/v3/ticker";

async function fetchTicker(quote: string): Promise<SatoshiTangoData> {
	try {
		const endpoint = `${apiBaseURL}/${quote}`;
		const response = await fetchWithTimeout(endpoint);

		if (!response.ok) {
			throw new APIError(
				endpoint,
				"SatoshiTango",
				`${response.status}: ${response.statusText}`,
			);
		}

		const jsonResponse = (await response.json()) as SatoshiTangoAPIResponse;
		const data: SatoshiTangoData = jsonResponse.data.ticker;

		return data;
	} catch (error) {
		throw new Error(
			`There was a problem with the Fetch operation to SatoshiTango API: ${error}`,
		);
	}
}

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[]> {
	try {
		// {"ARS": ["USDT", "BTC", ...], "USD": ["USDT", "BTC", ...]}
		const quoteToAssetsMap = new Map<string, string[]>();
		for (const pair of pairs) {
			if (quoteToAssetsMap.get(pair.fiat) !== undefined) {
				quoteToAssetsMap.get(pair.fiat)?.push(pair.crypto);
			}

			quoteToAssetsMap.set(pair.fiat, [pair.crypto]);
		}

		const promisesArray = Array.from(quoteToAssetsMap.entries()).map(
			(quoteAssets) =>
				new Promise<IBrokeragePairPrices[]>((resolve, reject) => {
					fetchTicker(quoteAssets[0])
						.then((apiResponse) => {
							const assets = quoteAssets[1];
							const value = assets.map((asset) => {
								if (Object.hasOwn(apiResponse, asset)) {
									return {
										crypto: asset,
										fiat: quoteAssets[0],
										ask: apiResponse[asset].ask,
										bid: apiResponse[asset].bid,
									};
								}

								throw new APIError(
									apiBaseURL + quoteAssets[0],
									"SatoshiTango",
									`Prices for pair "${asset}-${quoteAssets[0]}" not exist`,
								);
							});

							resolve(value);
						})
						.catch((reason) => reject(reason));
				}),
		);

		const result = await Promise.all(promisesArray);

		return result.flat();
	} catch (error) {
		if (!(error instanceof APIError)) {
			throw new Error(
				`There was a problem with the Fetch operation to TiendaCrypto API: ${error}`,
			);
		}

		throw error;
	}
}
