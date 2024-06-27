import { Schema, model } from "mongoose";
import {
	ICurrencyPair,
	ICurrencyRateActivity,
} from "../../model/currency_pair.model.js";

const currencyRateSchema = new Schema<ICurrencyRateActivity>({
	exchangeSlug: { type: String, required: true },
	exchangeName: { type: String, required: true },
	buy: { type: Number },
	sell: { type: Number },
	opening: { type: Number },
	closing: { type: Number },
	startActivityHour: {
		type: { hours: Number, minutes: Number },
		default: { hours: 10, minutes: 0 },
	},
	endActivityHour: {
		type: { hours: Number, minutes: Number },
		default: { hours: 15, minutes: 0 },
	},
	historical: { type: Number },
	updatedAt: { type: Date, required: true },
});

const currencyPairSchema = new Schema<ICurrencyPair>({
	base: { type: String, required: true },
	quote: { type: String, required: true },
	rates: [currencyRateSchema],
});

export const CurrencyPair = model<ICurrencyPair>(
	"CurrencyPair",
	currencyPairSchema,
);
