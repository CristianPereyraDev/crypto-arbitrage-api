import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";

export async function getPairPrices(
	pairs: IPair[],
): Promise<IBrokeragePairPrices[] | undefined> {
	try {
		const response = await fetchWithTimeout("https://argenbtc.com/cotizacion", {
			method: "POST",
		});

		if (response.ok) {
			const jsonResponse = JSON.parse(await response.text());

			return pairs.map((pair) => {
				let ask = 0;
				let bid = 0;
				switch (pair.crypto) {
					case "BTC":
						ask = parseFloat(jsonResponse.precio_compra);
						bid = parseFloat(jsonResponse.precio_venta);
						break;
					case "USDT":
						ask = parseFloat(jsonResponse.usdt_compra);
						bid = parseFloat(jsonResponse.usdt_venta);
						break;
					case "DAI":
						ask = parseFloat(jsonResponse.dai_compra);
						bid = parseFloat(jsonResponse.dai_venta);
						break;
				}

				return {
					crypto: pair.crypto,
					fiat: pair.fiat,
					ask,
					bid,
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
