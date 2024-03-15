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
			const jsonResponse = (await response.json()) as FiwindAPIResponse;

			return pairs.map((pair) => {
				const pairData = jsonResponse.find(
					(pairData) =>
						pairData.s ===
						pair.crypto.toUpperCase() + pair.crypto.toUpperCase(),
				);

				return {
					...pair,
					ask: pairData?.buy || 0,
					bid: pairData?.sell || 0,
				};
			});
		}

		return undefined;
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
