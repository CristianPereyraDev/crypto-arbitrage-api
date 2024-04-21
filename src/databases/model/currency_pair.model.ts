export interface ICurrencyRate {
	exchangeSlug: string;
	exchangeName: string;
	buy: number;
	sell: number;
	opening: number;
	closing: number;
	historical: number;
	variation: number;
	updatedAt: Date;
}

export interface ICurrencyPair {
	base: string;
	quote: string;
	rates: ICurrencyRate[];
}
