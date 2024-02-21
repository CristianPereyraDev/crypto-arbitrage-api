import dotenv from "dotenv";
import express from "express";
import { CronJob } from "cron";

import appSetup from "./startup/init.js";
import routerSetup from "./startup/router.js";
import securitySetup from "./startup/security.js";
import {
	collectCryptoBrokeragesPricesToDB,
	collectCryptoExchangesPricesToDB,
	collectCurrencyExchangesPricesToDB,
	collectP2POrdersToDB,
} from "./utils/pricing_collector/pricing_collector.js";
import ExchangeService from "./services/exchanges.service.js";
import websocketSetup from "./websocket/index.js";
import ExchangeRepositoryMongoDB from "./repository/impl/exchange-repository-mongodb.js";
import BrokerageRepositoryMongoDB from "./repository/impl/brokerage-repository-mongodb.js";
import { ExchangeP2PRepositoryMongoDB } from "./repository/impl/exchange-p2p-repository-mongodb.js";

dotenv.config();

const app = express();

appSetup(app)
	.then((server) => {
		securitySetup(app, express);
		routerSetup(app);
		websocketSetup(server);

		// Crypto rates collector interval
		setInterval(
			() => {
				collectCryptoExchangesPricesToDB().catch((reason) =>
					console.log(reason),
				);
				collectCryptoBrokeragesPricesToDB().catch((reason) =>
					console.log(reason),
				);
				collectP2POrdersToDB().catch((reason) => console.log(reason));
			},
			Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 1000 * 6),
		);

		// Currency rates collector
		setInterval(
			() => {
				collectCurrencyExchangesPricesToDB().catch((reason) =>
					console.log(reason),
				);
			},
			Number(process.env.CURRENCY_COLLECTOR_INTERVAL ?? 1000 * 60),
		);

		const exchangeService = new ExchangeService(
			new ExchangeRepositoryMongoDB(),
			new BrokerageRepositoryMongoDB(),
			new ExchangeP2PRepositoryMongoDB(),
		);

		// Scheduled Jobs
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const removeOlderPricesJob = new CronJob(
			"0 * * * * *",
			() => {
				console.log("Deleting older prices...");
				exchangeService.removeOlderPrices();
			},
			null,
			true,
		);
	})
	.catch((reason) => {
		console.log(reason);
	});
