import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import jwt from 'jsonwebtoken';

import { Exchange } from '../../databases/mongodb/schema/exchange.schema.js';
import { INetworkFee } from '../../data/model/exchange_base.model.js';
import { ExchangeBase } from '../../databases/mongodb/schema/exchange_base.schema.js';
import { ICriptoyaFees } from '../../data/apis/criptoya/index.js';
import { IExchangeBaseWithFeesDTO } from '../../data/dto/index.js';
import { exchangeFeesToDTO } from '../../repository/utils/repository.utils.js';
import { exchangeService } from '../app.js';

const controller = Router();

controller
  .get(
    '/pairs_available',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req: Request, res: Response, next: NextFunction) => {
      const availablePairs = await exchangeService.getAvailablePairs();
      const response: string[] = availablePairs.map(
        (pair) => `${pair.crypto}-${pair.fiat}`
      );

      if (response !== null)
        res.status(200).json({ success: true, message: 'ok', data: response });
      else
        res.status(400).json({ success: false, message: 'error', data: null });
    }
  )
  .get(
    '/exchanges',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const exchanges = await Exchange.find({}).exec();

        return res.status(200).json(exchanges);
      } catch (error) {
        return res.status(404).json({ message: 'Error' });
      }
    }
  )
  .get('/exchanges_available', async (req: Request, res: Response) => {
    try {
      const exchanges = await exchangeService.getAllAvailableExchangesList();
      const response = exchanges.map((exchange) => {
        const exchangeDTO: IExchangeBaseWithFeesDTO = {
          exchangeName: exchange.name,
          exchangeSlug: exchange.slug,
          URL: exchange.URL,
          logoURL: exchange.logoURL,
          exchangeType: exchange.exchangeType,
          available: exchange.available,
          availablePairs: exchange.availablePairs,
          fees: exchangeFeesToDTO(exchange),
        };

        return exchangeDTO;
      });

      return res.status(200).json(response);
    } catch (error) {
      return res.status(505).json({ message: error });
    }
  })
  .get(
    '/exchanges/:name',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req: Request, res: Response, next: NextFunction) => {
      const { name } = req.params;

      try {
        const exchange = await Exchange.findOne({ name: name }).exec();

        return res.status(200).json(exchange);
      } catch (error) {
        return res.status(404).json({ message: 'Error' });
      }
    }
  )
  .get(
    '/exchanges_available/:crypto-:fiat',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req: Request, res: Response, next: NextFunction) => {
      const { crypto, fiat } = req.params;
      try {
        const exchanges = await Exchange.find({}).exec();

        return res
          .status(200)
          .json(
            exchanges.filter(
              (exchange) =>
                exchange.availablePairs.find(
                  (pair) => pair.crypto === crypto && pair.fiat === fiat
                ) !== undefined
            )
          );
      } catch (error) {
        return res.status(404).json({ message: 'Error' });
      }
    }
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .get('/fees', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fees = await exchangeService.getAllFees();

      return res.status(200).json(fees);
    } catch (error) {
      return res.status(500).json({ message: 'Error' });
    }
  })
  .put(
    '/update_fees',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const response = await fetch('https://criptoya.com/api/fees');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fees = (await response.json()) as ICriptoyaFees;

        if (response.ok) {
          for (const exchange in fees) {
            const dbExchange = await ExchangeBase.findOne({ slug: exchange });

            if (dbExchange) {
              dbExchange.networkFees = [];
              for (const crypto in fees[exchange]) {
                const networks: INetworkFee[] = [];
                for (const network in fees[exchange][crypto]) {
                  networks.push({
                    network,
                    fee: fees[exchange][crypto][network],
                  });
                }

                dbExchange.networkFees.push({
                  crypto,
                  networks: networks,
                });
              }

              await dbExchange.save();
            }
          }

          return res.status(200).json(fees);
        }

        return res
          .status(400)
          .json({ message: 'An error has been occurred while getting fees' });
      } catch (error) {
        return res.status(404).json({ message: error });
      }
    }
  )
  .post(
    '/apiToken',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.header('x-api-key');
      const secret = process.env.WEBSOCKET_SECRET;

      if (!apiKey) {
        return res.status(400).json({ message: 'Missing API key in header' });
      }

      if (apiKey !== process.env.ROOT_API_KEY) {
        return res.status(400).json({ message: 'Invalid API key' });
      }

      if (secret) {
        const token = jwt.sign({ foo: 'bar' }, secret);

        return res.status(200).json({ token });
      }

      return res.status(500).json({ message: 'Error' });
    }
  );

export default controller;
