export interface ICurrencyRate {
	exchangeSlug: string;
	exchangeName: string;
	buy: number;
	sell: number;
	updatedAt: Date;
}

export interface ICurrencyRateActivity extends ICurrencyRate {
	startActivityHour: { hours: number; minutes: number };
	endActivityHour: { hours: number; minutes: number };
	opening: number;
	closing: number;
	historical: number;
}

export interface ICurrencyPair {
	base: string;
	quote: string;
	rates: ICurrencyRateActivity[];
}
