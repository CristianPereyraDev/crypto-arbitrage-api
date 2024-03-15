import dotenv from "dotenv";
import express from "express";

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
		setInterval(
			() => {
				collectCurrencyExchangesPricesToDB().catch((reason) =>
					console.log(reason),
				);
			},
			Number(process.env.CURRENCY_COLLECTOR_INTERVAL ?? 1000 * 60),
		);
	})
	.catch((reason) => {
		console.log(reason);
	});
