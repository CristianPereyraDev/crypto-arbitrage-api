import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";

type SaldoAPIResponse = {
	[asset: string]: {
		ask: number;
		bid: number;
		currency: string;
		bid_url: string;
		ask_url: string;
	};
};

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[] | undefined> {
	try {
		const response = await fetchWithTimeout(
			"https://api.saldo.com.ar/json/rates/banco",
		);

		if (response.ok) {
			const jsonResponse = (await response.json()) as SaldoAPIResponse;

			return pairs.map((pair) => {
				switch (pair.crypto) {
					case "BTC":
						return {
							crypto: pair.crypto,
							fiat: pair.fiat,
							bid: jsonResponse.bitcoin.ask,
							ask: jsonResponse.bitcoin.bid,
						};

					case "USDT":
						return {
							crypto: pair.crypto,
							fiat: pair.fiat,
							bid: jsonResponse.usdt.ask,
							ask: jsonResponse.usdt.bid,
						};

					case "DAI":
						return {
							crypto: pair.crypto,
							fiat: pair.fiat,
							bid: jsonResponse.dai.ask,
							ask: jsonResponse.dai.bid,
						};

					default:
						return { crypto: pair.crypto, fiat: pair.fiat, bid: 0, ask: 0 };
				}
			});
		}

		console.error(`${response.status} - ${response.statusText}`);
		return undefined;
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
