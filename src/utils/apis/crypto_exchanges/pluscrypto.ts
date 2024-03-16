import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";

type PlusCryptoAPIResponse = {
	coin: string;
	coin_to: string;
	pair: string;
	sell: number;
	buy: number;
	time: string;
	variation: string;
	order: number;
	stable: boolean;
	primary: boolean;
	icon: boolean;
	network: string;
	open_loop: number;
	allow_buy: boolean;
	allow_sell: boolean;
	allow_deposit: boolean;
	withdraw: boolean;
	allow_withdraw: boolean;
	warning_withdraw: string | null;
};

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[] | undefined> {
	try {
		const response = await fetchWithTimeout(
			"https://api.pluscambio.com.ar/crypto/coins?front-web=true",
			{
				method: "GET",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Origin: "https://pluscrypto.com.ar",
					Referer: "https://pluscrypto.com.ar",
				},
			},
		);

		if (response.ok) {
			const jsonResponse = (await response.json()) as PlusCryptoAPIResponse[];

			return pairs.map((pair) => {
				const pairData = jsonResponse.find(
					(data) => data.coin === pair.crypto && data.coin_to === pair.fiat,
				);

				if (pairData) {
					return {
						crypto: pair.crypto,
						fiat: pair.fiat,
						ask: pairData.sell,
						bid: pairData.buy,
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
