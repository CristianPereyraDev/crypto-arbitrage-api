import { Router, type Request, type Response } from "express";
import CurrencyService from "../services/currency.service.js";

const currenciesController = Router();
const currencyService = new CurrencyService();

currenciesController.get(
	"/:base/:quote",
	async (req: Request, res: Response) => {
		const { base, quote } = req.params;

		try {
			const rates = await currencyService.getCurrencyPairRates(base, quote);

			return res.status(200).json({
				rates,
			});
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).json({
					error: error.message,
				});
			}

			return res.status(400).json({
				error: `An error has occurred while trying to obtain the ${base}-${quote} rates`,
			});
		}
	},
);

export default currenciesController;
