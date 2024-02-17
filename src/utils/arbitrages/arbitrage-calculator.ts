import { IExchangeFees } from "../../databases/mongodb/utils/queries.util.js";
import { type IExchangePairPricing } from "../../types/exchange.js";
import { IExchangePricingDTO } from "../../types/dto/index.js";
import ExchangeService from "../../services/exchanges.service.js";
import ExchangeRepositoryMongoDB from "../../repository/impl/exchange-repository-mongodb.js";
import BrokerageRepositoryMongoDB from "../../repository/impl/brokerage-repository-mongodb.js";
import { ExchangeP2PRepositoryMongoDB } from "../../repository/impl/exchange-p2p-repository-mongodb.js";
import {
	IP2POrder,
	IPaymentMethod,
} from "src/databases/model/exchange_p2p.model.js";

const exchangeService = new ExchangeService(
	new ExchangeRepositoryMongoDB(),
	new BrokerageRepositoryMongoDB(),
	new ExchangeP2PRepositoryMongoDB(),
);

export interface ICryptoArbitrageResult {
	askExchange: string;
	askPrice: number;
	bidExchange: string;
	bidPrice: number;
	profit: number;
	time: number;
}

export async function calculateArbitragesFromPairData(
	data: IExchangePairPricing | undefined,
): Promise<ICryptoArbitrageResult[]> {
	if (data === undefined) return [];

	const arbitrages: ICryptoArbitrageResult[] = [];

	// Get exchange fees. Se supone que los fees son porcentajes (hay que dividir por 100).
	const fees = await exchangeService.getAllFees();

	const exchangesArr: { exchange: string; value: IExchangePricingDTO }[] = [];
	data.forEach((value, exchange) => {
		exchangesArr.push({ exchange, value });
	});

	for (let i = 0; i < exchangesArr.length; i++) {
		const askExchange1 = exchangesArr[i].value.ask;
		const bidExchange1 = exchangesArr[i].value.bid;
		let totalAskExchange1 =
			exchangesArr[i].value.ask !== null ? exchangesArr[i].value.ask : 0;
		let totalBidExchange1 = exchangesArr[i].value.bid;

		const exchangeFees1 = Object.hasOwn(fees, exchangesArr[i].exchange)
			? fees[exchangesArr[i].exchange]
			: undefined;

		if (exchangeFees1 !== undefined) {
			const buyFeeExchange1 = Math.max(
				exchangeFees1.buyFee,
				exchangeFees1.takerFee,
			);

			const sellFeeExchange1 = Math.max(
				exchangeFees1.sellFee,
				exchangeFees1.takerFee,
			);

			totalAskExchange1 *= 1 + buyFeeExchange1 / 100;
			totalBidExchange1 *= 1 - sellFeeExchange1 / 100;
		}

		for (let j = i; j < exchangesArr.length; j++) {
			const askExchange2 = exchangesArr[j].value.ask;
			const bidExchange2 = exchangesArr[j].value.bid;
			let totalAskExchange2 = exchangesArr[j].value.ask;
			let totalBidExchange2 = exchangesArr[j].value.bid;

			const exchangeFees2 = Object.hasOwn(fees, exchangesArr[j].exchange)
				? fees[exchangesArr[j].exchange]
				: undefined;

			if (exchangeFees2 !== undefined) {
				const buyFeeExchange2 = Math.max(
					exchangeFees2.buyFee,
					exchangeFees2.takerFee,
				);

				const sellFeeExchange2 = Math.max(
					exchangeFees2.sellFee,
					exchangeFees2.takerFee,
				);

				totalAskExchange2 *= 1 + buyFeeExchange2 / 100;
				totalBidExchange2 *= 1 - sellFeeExchange2 / 100;
			}

			let [maxBidExchange, minAskExchange] = ["", ""];
			let [maxBid, maxTotalBid, minAsk, minTotalAsk] = [0, 0, 0, 0];

			if (totalBidExchange1 >= totalBidExchange2) {
				maxBidExchange = exchangesArr[i].exchange;
				maxBid = bidExchange1;
				maxTotalBid = totalBidExchange1;
			} else {
				maxBidExchange = exchangesArr[j].exchange;
				maxBid = bidExchange2;
				maxTotalBid = totalBidExchange2;
			}

			if (totalAskExchange1 <= totalAskExchange2) {
				minAskExchange = exchangesArr[i].exchange;
				minAsk = askExchange1;
				minTotalAsk = totalAskExchange1;
			} else {
				minAskExchange = exchangesArr[j].exchange;
				minAsk = askExchange2;
				minTotalAsk = totalAskExchange2;
			}

			// Check > 0 because some exchanges can have ask price = 0 or bid price = 0
			const profit =
				minAsk > 0 ? ((maxTotalBid - minTotalAsk) / minTotalAsk) * 100 : 0;

			if (profit > 0) {
				arbitrages.push({
					askExchange: minAskExchange,
					askPrice: minAsk,
					bidExchange: maxBidExchange,
					bidPrice: maxBid,
					profit: profit,
					time: Math.max(
						exchangesArr[i].value.time,
						exchangesArr[j].value.time,
					),
				});
			}
		}
	}

	return arbitrages;
}

export function calculateTotalBid({
	baseBid,
	fees,
	includeWithdrawalFiatFee,
}: {
	baseBid: number;
	fees?: IExchangeFees;
	includeWithdrawalFiatFee: boolean;
}) {
	if (fees !== undefined) {
		const totalFees = includeWithdrawalFiatFee
			? fees.sellFee + fees.withdrawalFiatFee
			: fees.sellFee;
		return baseBid * (1 - totalFees / 100);
	}
	return baseBid;
}

export function calculateTotalAsk({
	baseAsk,
	fees,
	includeDepositFiatFee,
}: {
	baseAsk: number;
	fees?: IExchangeFees;
	includeDepositFiatFee: boolean;
}) {
	if (fees !== undefined) {
		const totalFees = includeDepositFiatFee
			? fees.buyFee + fees.depositFiatFee
			: fees.buyFee;

		return baseAsk * (1 + totalFees / 100);
	}
	return baseAsk;
}

export type P2PArbitrage = {
	buyOrder: IP2POrder | null;
	sellOrder: IP2POrder | null;
	profit: number;
};

const SELL_ORDER: IP2POrder = {
	price: 0,
	payments: [],
	volume: 0,
	orderId: "NULL",
	orderType: "SELL",
	merchantId: "NULL",
	monthOrderCount: 0,
	monthFinishRate: 1,
	min: 1,
	max: 1,
	positiveRate: 1,
	link: "",
	userType: "user",
	merchantName: "CryptoARbitrage",
};
const BUY_ORDER: IP2POrder = { ...SELL_ORDER, orderType: "BUY" };

/**
 *
 * @param buyOrders
 * @param sellOrders
 * @param volume
 * @param minProfit
 * @param payments
 * @returns
 */
export function calculateP2PArbitrage(
	buyOrders: IP2POrder[],
	sellOrders: IP2POrder[],
	volume: number,
	minProfit: number,
	payments: IPaymentMethod[],
): P2PArbitrage {
	const result: P2PArbitrage = {
		buyOrder: null,
		sellOrder: null,
		profit: 0,
	};
	const buyOrdersFiltered = buyOrders.filter((order) =>
		order.payments.some((payment) =>
			payments.some(
				(preferredPayment) => preferredPayment.slug === payment.slug,
			),
		),
	);
	const sellOrdersFiltered = sellOrders.filter((order) =>
		order.payments.some((payment) =>
			payments.some(
				(preferredPayment) => preferredPayment.slug === payment.slug,
			),
		),
	);

	if (buyOrdersFiltered.length === 0 || sellOrdersFiltered.length === 0) {
		return result;
	}

	result.buyOrder = sellOrdersFiltered[0];
	result.sellOrder = buyOrdersFiltered[0];
	let profit = result.sellOrder.price - result.buyOrder.price;

	// Find the best sell order from buy orders.
	for (const buyOrder of buyOrdersFiltered) {
		const friendlinessRange = (buyOrder.max - buyOrder.min) / buyOrder.price;
		if (
			friendlinessRange / buyOrder.volume > 1.0 &&
			buyOrder.positiveRate >= 0.95 &&
			buyOrder.monthOrderCount > 500
		) {
			result.sellOrder = {
				...SELL_ORDER,
				price: buyOrder.price * 1.01, // sell a little more expensive
				payments,
				volume,
				min: buyOrder.min,
				max: buyOrder.max,
			};
		}
	}

	// Find the best buy order from sell orders.
	for (const sellOrder of sellOrdersFiltered) {
		const friendlinessRange = (sellOrder.max - sellOrder.min) / sellOrder.price;
		if (
			friendlinessRange / sellOrder.volume > 1.0 &&
			sellOrder.positiveRate >= 0.95 &&
			sellOrder.monthOrderCount > 500
		) {
			result.sellOrder = {
				...BUY_ORDER,
				price: sellOrder.price * 0.99, // buy a little cheaper
				payments,
				volume,
				min: sellOrder.min,
				max: sellOrder.max,
			};
		}
	}

	if (result.sellOrder && result.buyOrder) {
		profit = result.sellOrder.price - result.buyOrder.price;

		if (profit >= minProfit) {
			return result;
		}
	}

	return { buyOrder: null, sellOrder: null, profit: 0 };
}
