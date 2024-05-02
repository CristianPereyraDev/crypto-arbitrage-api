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
import websocketSetup from "./websocket/index.js";

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
		const currencyJob = new CronJob(
			"*/5 * * * *",
			() => {
				collectCurrencyExchangesPricesToDB().catch((reason) =>
					console.log(reason),
				);
			},
			null,
			false,
			"America/Argentina/Buenos_Aires",
		);
		currencyJob.start();
	})
	.catch((reason) => {
		console.log(reason);
	});
