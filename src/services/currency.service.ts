import { ICurrencyRate } from "../databases/model/currency_pair.model.js";
import { CurrencyPair } from "../databases/mongodb/schema/currency_pair.schema.js";

export default class CurrencyService {
	async updateCurrencyPairRate(
		currencyBase: string,
		currencyQuote: string,
		newRates: ICurrencyRate[],
	) {
		try {
			const currencyPairDoc = await CurrencyPair.findOne({
				base: currencyBase,
				quote: currencyQuote,
			});

			if (currencyPairDoc) {
				const now = new Date();

				for (const currentRate of currencyPairDoc.rates) {
					const newRate = newRates.find(
						(rate) => rate.exchangeSlug === currentRate.exchangeSlug,
					);
					const startActivity = new Date();
					startActivity.setHours(
						currentRate.startActivityHour.hours,
						currentRate.startActivityHour.minutes,
					);
					const endActivity = new Date();
					endActivity.setHours(
						currentRate.endActivityHour.hours,
						currentRate.endActivityHour.minutes,
					);

					if (newRate) {
						currentRate.buy = newRate.buy;
						currentRate.sell = newRate.sell;

						if (now.getTime() === startActivity.getTime()) {
							currentRate.opening = newRate.sell;
						}
						if (now.getTime() === endActivity.getTime()) {
							currentRate.closing = newRate.sell;
						}

						currentRate.updatedAt = newRate.updatedAt;
					}
				}

				await currencyPairDoc.save();
			} else {
				await CurrencyPair.create({
					base: currencyBase,
					quote: currencyQuote,
					rates: newRates,
				});
			}
		} catch (error) {
			console.log("Can not update the mongodb document: %s", error);
		}
	}

	async getCurrencyPairRates(base: string, quote: string) {
		const currencyPair = await CurrencyPair.findOne({
			base,
			quote,
		});

		if (currencyPair) {
			return currencyPair.rates;
		}

		throw new Error(`The pair ${base}-${quote} does not exist`);
	}
}
