import {
	Router,
	type Request,
	type Response,
	type NextFunction,
} from "express";
import CryptoArbitrageModel from "../databases/mongodb/schema/arbitrage.schema.js";
import { collectArbitrages } from "../utils/pricing_collector/pricing_collector.js";

const controller = Router();

controller
	.get(
		"/:crypto/:fiat/:minProfit",
		async (req: Request, res: Response, next: NextFunction) => {
			const { crypto, fiat, minProfit } = req.params;

			try {
				const minTimeInSeconds = (Date.now() - 60000) / 1000;

				// Find arbitrages with aggregation.
				const aggregate = await CryptoArbitrageModel.aggregate([
					{
						$match: {
							cryptocurrency: crypto.toUpperCase(),
							fiat: fiat.toUpperCase(),
							time: { $gte: minTimeInSeconds },
							profit: {
								$gte: Number(minProfit),
							},
						},
					},
					{
						$sort: {
							time: -1,
						},
					},
					{
						$group: {
							_id: {
								bidExchange: "$bidExchange",
								askExchange: "$askExchange",
							},
							lastArbitrage: {
								$first: "$$ROOT",
							},
						},
					},
				]);

				return aggregate.length > 0
					? res.status(200).json({
							arbitrageFound: true,
							arbitrages: aggregate.map((elem) => elem.lastArbitrage),
					  })
					: res
							.status(200)
							.json({ arbitrageFound: false, message: "Arbitrage not found." });
			} catch (error) {
				next(error);
			}
		},
	)
	.get(
		"/:crypto/:fiat/:volume/:minProfit",
		async (req: Request, res: Response, next: NextFunction) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { crypto, fiat, volume, minProfit } = req.params;

			try {
				const arbitrages = await collectArbitrages(
					crypto,
					fiat,
					Number(volume),
				);

				if (arbitrages.length > 0) {
					return res.status(200).json({ arbitrageFound: true, arbitrages });
				}

				return res
					.status(200)
					.json({ arbitrageFound: false, message: "Arbitrages not found." });
			} catch (error) {
				next(error);
			}
		},
	);

export default controller;
