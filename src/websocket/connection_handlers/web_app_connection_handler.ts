import BrokerageRepositoryMongoDB from "../../repository/impl/brokerage-repository-mongodb.js";
import ExchangeRepositoryMongoDB from "../../repository/impl/exchange-repository-mongodb.js";
import { ExchangeP2PRepositoryMongoDB } from "../../repository/impl/exchange-p2p-repository-mongodb.js";
import ExchangeService, {
	ExchangesFeesType,
} from "../../services/exchanges.service.js";
import { CryptoPairWebSocketConfig } from "../types.js";
import { getCurrencyPairRates } from "../../services/currency.service.js";
import {
	calculateTotalAsk,
	calculateTotalBid,
} from "../../utils/arbitrages/arbitrage-calculator.js";
import { IExchangePricingDTO } from "../../types/dto/index.js";

import { WebSocket } from "ws";
import pug from "pug";
import path from "path";
import { ExchangeBaseRepositoryMongoBD } from "../../repository/impl/exchange-base-repository-mongodb.js";

const exchangeService = new ExchangeService(
	new ExchangeBaseRepositoryMongoBD(),
	new ExchangeRepositoryMongoDB(),
	new BrokerageRepositoryMongoDB(),
	new ExchangeP2PRepositoryMongoDB(),
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function wsWebConnectionHandler(websocket: WebSocket) {
	let currencyRatesTimeout: ReturnType<typeof setInterval>;
	const cryptoPairMsgConfig = new Map<string, CryptoPairWebSocketConfig>();
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
			compileCryptoMessage(
				key.split("-")[0],
				key.split("-")[1],
				value.volume,
				fees,
				includeFees,
			).then((msg) => websocket.send(msg));
		});
	}, 1000 * 6);

	websocket.on("error", (error) => {
		console.log("An error has ocurred in the websocket: %s", error);
		clearInterval(exchangePricesTimeout);
		clearInterval(currencyRatesTimeout);
	});

	websocket.on("close", () => {
		console.log("The client has been closed the connection");
		clearInterval(exchangePricesTimeout);
		clearInterval(currencyRatesTimeout);
	});

	websocket.on("message", (message) => {
		const parsedMessage = JSON.parse(message.toString());

		if (Object.hasOwn(parsedMessage, "crypto")) {
			cryptoPairMsgConfig.set(
				`${parsedMessage.crypto.asset}-${parsedMessage.crypto.fiat}`,
				{ volume: parsedMessage.crypto.volume },
			);
		} else if (Object.hasOwn(parsedMessage, "currency")) {
			clearInterval(currencyRatesTimeout);

			compileCurrencyPairMessage(
				parsedMessage.currency.base,
				parsedMessage.currency.quote,
			).then((msg) => websocket.send(msg));

			currencyRatesTimeout = setInterval(() => {
				compileCurrencyPairMessage(
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

async function compileCryptoMessage(
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

	const __dirname = new URL(".", import.meta.url).pathname;

	const template = pug.compileFile(
		path.resolve(__dirname, "../../views/symbol_prices.pug"),
	);

	return template({
		asset: asset,
		fiat: fiat,
		pricesSortedByAsk: [...pricesWithFees].sort((p1, p2) =>
			p1.totalAsk && p2.totalAsk
				? p1.totalAsk - p2.totalAsk
				: p1.totalAsk
				  ? -1
				  : 1,
		),
		pricesSortedByBid: [...pricesWithFees].sort((p1, p2) =>
			p1.totalBid && p2.totalBid
				? p2.totalBid - p1.totalBid
				: p1.totalBid
				  ? -1
				  : 1,
		),
	});
}

async function compileCurrencyPairMessage(
	currencyBase: string,
	currencyQuote: string,
) {
	const rates = await getCurrencyPairRates(currencyBase, currencyQuote);

	const __dirname = new URL(".", import.meta.url).pathname;

	const template = pug.compileFile(
		path.resolve(__dirname, "../../views/currency_pair_prices.pug"),
	);

	return template({
		currencyBase,
		currencyQuote,
		rates: rates !== undefined ? rates : [],
	});
}
