import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";

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

async function fetchTicker(quote: string): Promise<SatoshiTangoData> {
	try {
		const response = await fetchWithTimeout(
			`https://api.satoshitango.com/v3/ticker/${quote}`,
		);

		if (response.ok) {
			const jsonResponse = (await response.json()) as SatoshiTangoAPIResponse;
			const data: SatoshiTangoData = jsonResponse.data.ticker;

			return data;
		}

		throw new Error(`${response.status}: ${response.statusText}`);
	} catch (error) {
		throw new Error(`SatoshiTango fetch error: ${quote} -> ${error}`);
	}
}

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[] | undefined> {
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
				new Promise<IBrokeragePairPrices[]>((resolve) => {
					fetchTicker(quoteAssets[0])
						.then((apiResponse) => {
							const assets = quoteAssets[1];
							resolve(
								assets.map((asset) => {
									if (Object.hasOwn(apiResponse, asset)) {
										return {
											crypto: asset,
											fiat: quoteAssets[0],
											ask: apiResponse[asset].ask,
											bid: apiResponse[asset].bid,
										};
									}

									return {
										crypto: asset,
										fiat: quoteAssets[0],
										ask: 0,
										bid: 0,
									};
								}),
							);
						})
						.catch((reason) => {
							console.error(reason);

							resolve(
								quoteAssets[1].map((asset) => {
									return {
										crypto: asset,
										fiat: quoteAssets[0],
										ask: 0,
										bid: 0,
									};
								}),
							);
						});
				}),
		);

		const result = await Promise.allSettled(promisesArray);

		return result.flatMap((promiseResult) => {
			if (promiseResult.status === "fulfilled") {
				return promiseResult.value;
			}

			console.error(promiseResult.reason);
			return [];
		});
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
