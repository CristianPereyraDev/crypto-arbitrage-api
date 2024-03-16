import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";

export type TiendaCryptoAPIResponseType = {
	[pair: string]: {
		coin: string;
		timestamp: string;
		buy: string;
		sell: string;
	};
};

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[] | undefined> {
	try {
		const response = await fetchWithTimeout(
			"https://api.tiendacrypto.com/v1/price/all",
		);

		if (response.ok) {
			const apiResponse =
				(await response.json()) as TiendaCryptoAPIResponseType;

			return pairs.map((pair) => {
				if (
					Object.hasOwn(
						apiResponse,
						`${pair.crypto.toUpperCase()}_${pair.fiat.toUpperCase()}`,
					)
				) {
					const pairData =
						apiResponse[
							`${pair.crypto.toUpperCase()}_${pair.fiat.toUpperCase()}`
						];

					return {
						crypto: pair.crypto,
						fiat: pair.fiat,
						ask: parseFloat(pairData.buy),
						bid: parseFloat(pairData.sell),
					};
				}

				return {
					crypto: pair.crypto,
					fiat: pair.fiat,
					ask: 0,
					bid: 0,
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
