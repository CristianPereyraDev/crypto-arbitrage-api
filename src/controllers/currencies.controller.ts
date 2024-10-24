import { Router, type Request, type Response } from 'express';
import CurrencyService from '../exchanges/services/currency.service.js';

const currenciesController = Router();
const currencyService = new CurrencyService();

currenciesController.get(
  '/:base/:quote',
  async (req: Request, res: Response) => {
    const { base, quote } = req.params;

    try {
      const rates = await currencyService.getCurrencyPairRates(base, quote);

      return res.status(200).json({
        rates: rates.map((rate) => {
          return {
            exchangeSlug: rate.exchangeSlug,
            exchangeName: rate.exchangeName,
            buy: rate.buy,
            sell: rate.sell,
            opening: rate.opening,
            closing: rate.closing,
            startActivityHour: `${rate.startActivityHour.hours.toLocaleString(
              'es-AR',
              {
                minimumIntegerDigits: 2,
                maximumFractionDigits: 0,
              }
            )}:${rate.startActivityHour.minutes.toLocaleString('es-AR', {
              minimumIntegerDigits: 2,
              maximumFractionDigits: 0,
            })}`,
            endActivityHour: `${rate.endActivityHour.hours.toLocaleString(
              'es-AR',
              {
                minimumIntegerDigits: 2,
                maximumFractionDigits: 0,
              }
            )}:${rate.endActivityHour.minutes.toLocaleString('es-AR', {
              minimumIntegerDigits: 2,
              maximumFractionDigits: 0,
            })}`,

            historical: rate.historical,
            updatedAt: rate.updatedAt,
          };
        }),
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
  }
);

export default currenciesController;
