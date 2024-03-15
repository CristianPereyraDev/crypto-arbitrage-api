import { fetchWithTimeout } from "../../../utils/network.utils.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";
import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";

type BitmonederoAPIResponse = {
	buy_btc_ars: number;
	buy_btc_ars_fee: number;
	sell_btc_ars: number;
	buy_trxusdt_ars: number;
	buy_trxusdt_ars_fee: number;
	sell_trxusdt_ars: number;
	updated_at_prices: string;
	withdrawal_fee: number;
};

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[] | undefined> {
	try {
		const response = await fetchWithTimeout(
			"https://www.bitmonedero.com/api/btc-ars",
		);

		if (response.ok) {
			const jsonResponse = (await response.json()) as BitmonederoAPIResponse;

			return pairs.map((pair) => {
				switch (pair.crypto) {
					case "BTC":
						return {
							...pair,
							ask: jsonResponse.buy_btc_ars,
							bid: jsonResponse.sell_btc_ars,
						};

					case "USDT":
						return {
							...pair,
							ask: jsonResponse.buy_trxusdt_ars,
							bid: jsonResponse.sell_trxusdt_ars,
						};
					default:
						return {
							...pair,
							ask: 0,
							bid: 0,
						};
				}
			});
		}

		return undefined;
	} catch (error) {
		console.error(error);
		return undefined;
	}
}
