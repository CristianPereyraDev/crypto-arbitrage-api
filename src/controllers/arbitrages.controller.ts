import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import CryptoArbitrageModel from '../databases/mongodb/schema/arbitrage.schema.js';

const controller = Router();

controller.get(
  '/:crypto/:fiat/:minProfit',
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
              bidExchange: '$bidExchange',
              askExchange: '$askExchange',
            },
            lastArbitrage: {
              $first: '$$ROOT',
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
            .json({ arbitrageFound: false, message: 'Arbitrage not found.' });
    } catch (error) {
      next(error);
    }
  }
);

export default controller;
