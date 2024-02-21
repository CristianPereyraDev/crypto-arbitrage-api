/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-unused-vars */
import BrokerageRepositoryMongoDB from "../../repository/impl/brokerage-repository-mongodb.js";
import ExchangeRepositoryMongoDB from "../../repository/impl/exchange-repository-mongodb.js";
import { ExchangeP2PRepositoryMongoDB } from "../../repository/impl/exchange-p2p-repository-mongodb.js";
import ExchangeService, {
	type ExchangesFeesType,
} from "../../services/exchanges.service.js";
import {
	CryptoP2PWebSocketConfig,
	CryptoPairWebSocketConfig,
	P2PWebSocketMessage,
} from "../types.js";
import { getCurrencyPairRates } from "../../services/currency.service.js";
import {
	calculateP2PArbitrage,
	calculateTotalAsk,
	calculateTotalBid,
} from "../../utils/arbitrages/arbitrage-calculator.js";
import { IExchangePricingDTO } from "../../types/dto/index.js";

import { WebSocket } from "ws";
import { IncomingMessage } from "http";

const exchangeService = new ExchangeService(
	new ExchangeRepositoryMongoDB(),
	new BrokerageRepositoryMongoDB(),
	new ExchangeP2PRepositoryMongoDB(),
);

export async function wsNativeConnectionHandler(
	websocket: WebSocket,
	connectionRequest: IncomingMessage,
) {
	let currencyRatesTimeout: ReturnType<typeof setInterval>;

	const cryptoPairMsgConfig = new Map<string, CryptoPairWebSocketConfig>();
	const cryptoP2PMsgConfig = new Map<string, CryptoP2PWebSocketConfig>();

	let fees: ExchangesFeesType;
	let includeFees = false;
	exchangeService
		.getAllFees()
		.then((value) => {
			fees = value;
		})
		.catch(() => {
			fees = null;
		});

	const exchangePricesTimeout = setInterval(() => {
		cryptoPairMsgConfig.forEach((value, key) => {
			makeCryptoMessage(
				key.split("-")[0],
				key.split("-")[1],
				value.volume,
				fees,
				includeFees,
			).then((msg) => websocket.send(msg));
		});
	}, 1000 * 6);

	const p2pOrdersTimeout = setInterval(() => {
		cryptoP2PMsgConfig.forEach((msgConfig, p2pExchangeName) => {
			for (const pair of msgConfig.pairs) {
				exchangeService.getP2POrders(p2pExchangeName, pair).then((orders) => {
					if (orders) {
						const message: P2PWebSocketMessage = {
							p2p: {
								arbitrage: calculateP2PArbitrage(
									orders.buyOrders,
									orders.sellOrders,
									msgConfig.volume,
									msgConfig.minProfit,
									[{ slug: "MercadoPagoNew", name: "Mercadopago" }],
									"merchant",
								),
								exchange: p2pExchangeName,
								crypto: orders.crypto,
								fiat: orders.fiat,
								buyOrders: orders.buyOrders,
								sellOrders: orders.sellOrders,
							},
						};
						websocket.send(JSON.stringify(message));
					}
				});
			}
		});
	}, 1000 * 6);

	websocket.on("error", (error) => {
		console.log("An error has ocurred in the websocket: %s", error);
		clearInterval(exchangePricesTimeout);
		clearInterval(currencyRatesTimeout);
		clearInterval(p2pOrdersTimeout);
	});

	websocket.on("close", () => {
		console.log("The client has been closed the connection");
		clearInterval(exchangePricesTimeout);
		clearInterval(currencyRatesTimeout);
		clearInterval(p2pOrdersTimeout);
	});

	websocket.on("message", (message) => {
		const parsedMessage = JSON.parse(message.toString());

		if (Object.hasOwn(parsedMessage, "crypto")) {
			cryptoPairMsgConfig.set(
				`${parsedMessage.crypto.asset} - ${parsedMessage.crypto.fiat}`,
				{ volume: parsedMessage.crypto.volume },
			);
		} else if (Object.hasOwn(parsedMessage, "p2p")) {
			cryptoP2PMsgConfig.set(parsedMessage.p2p.exchange, {
				pairs: [{ crypto: "USDT", fiat: "ARS" }],
				minProfit: parsedMessage.p2p.minProfit,
				volume: parsedMessage.p2p.volume,
			});
		} else if (Object.hasOwn(parsedMessage, "currency")) {
			clearInterval(currencyRatesTimeout);

			makeCurrencyPairMessage(
				parsedMessage.currency.base,
				parsedMessage.currency.quote,
			).then((msg) => websocket.send(msg));

			currencyRatesTimeout = setInterval(() => {
				makeCurrencyPairMessage(
					parsedMessage.currency.base,
					parsedMessage.currency.quote,
				).then((msg) => websocket.send(msg));
			}, 1000 * 60);
		} else if (Object.hasOwn(parsedMessage, "HEADERS")) {
			const headers = parsedMessage.HEADERS;
			if (headers["HX-Trigger"] === "form-settings") {
				includeFees = Object.hasOwn(parsedMessage, "includeFees");
			}
		}
	});
}

// async function makeP2PMessage(
//   p2pExchangeName: string,
//   config: CryptoP2PWebSocketConfig
// ) { }

async function makeCryptoMessage(
	asset: string,
	fiat: string,
	volume: number,
	fees?: ExchangesFeesType,
	includeFees = true,
) {
	const prices: IExchangePricingDTO[] =
		await exchangeService.getAllExchangesPricesBySymbol(asset, fiat, volume);
	const pricesWithFees =
		fees && includeFees
			? prices.map((price) => {
					const exchangeFees =
						fees[price.exchange.replaceAll(" ", "").toLocaleLowerCase()];

					if (exchangeFees !== undefined) {
						return {
							...price,
							totalAsk: calculateTotalAsk({
								baseAsk: price.ask,
								fees: exchangeFees,
								includeDepositFiatFee: false,
							}),
							totalBid: calculateTotalBid({
								baseBid: price.bid,
								fees: exchangeFees,
								includeWithdrawalFiatFee: false,
							}),
						};
					}
					return price;
			  })
			: prices;

	return JSON.stringify({
		asset: asset,
		fiat: fiat,
		prices: pricesWithFees,
	});
}

async function makeCurrencyPairMessage(
	currencyBase: string,
	currencyQuote: string,
) {
	const rates = await getCurrencyPairRates(currencyBase, currencyQuote);

	return JSON.stringify({
		currencyBase,
		currencyQuote,
		rates: rates !== undefined ? rates : [],
	});
}
