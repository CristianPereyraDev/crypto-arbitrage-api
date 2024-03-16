import { IPair } from "src/databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { IBrokeragePairPrices } from "src/databases/model/brokerage.model.js";

export type FiwindAPIResponse = {
	s: string;
	buy: number;
	sell: number;
	variation: number;
	ts: number; // Timestamp
}[];

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[] | undefined> {
	try {
		const response = await fetchWithTimeout(
			"https://api.fiwind.io/v1.0/prices/list",
		);

		if (response.ok) {
			const apiResponse = (await response.json()) as FiwindAPIResponse;

			return pairs.map((pair) => {
				const pairData = apiResponse.find(
					(pairData) =>
						pairData.s === pair.crypto.toUpperCase() + pair.fiat.toUpperCase(),
				);

				return {
					crypto: pair.crypto,
					fiat: pair.fiat,
					ask: pairData?.buy || 0,
					bid: pairData?.sell || 0,
				};
			});
		}

		console.error(`${response.status} - ${response.statusText}`);
		return undefined;
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
