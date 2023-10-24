import { Router, type Request, type Response, type NextFunction } from 'express'
import { currencyPairs } from '../startup/pricing_collector.js'

const exchangesAvailables: string[] = [
  'ArgenBTC',
  'AstroPay',
  'Banexcoin',
  'belo',
  'Binance',
  'BitcoinToYou',
  'BitcoinTrade',
  'Bitex',
  'Bitmonedero',
  'Bitso',
  'Bitso Alpha',
  'Brasil Bitcoin',
  'Buda',
  'Buenbit',
  'Bybit',
  'Calypso P2P',
  'Copter',
  'CryptoMarket',
  'Decrypto',
  'Domitai',
  'Eluter',
  'Fiwind',
  'FlowBTC',
  'Fluyez',
  'Foxbit',
  'Kripton Market',
  'Latamex',
  'Lemon Cash',
  "Let'sBit",
  'Mercado Bitcoin',
  'Orionx',
  'PagCripto',
  'Plus Crypto',
  'Ripio',
  'Ripio Trade',
  'Saldo',
  'SatoshiTango',
  'TiendaCrypto',
  'TruBit',
  'Vibrant',
  'Vita Wallet'
]

const controller = Router()

controller
  .get(
    '/pairs_available',
    async (req: Request, res: Response, next: NextFunction) => {
      return res.status(200).json(currencyPairs)
    }
  )
  .get(
    '/exchanges_available',
    async (req: Request, res: Response, next: NextFunction) => {
      return res.status(200).json(exchangesAvailables)
    }
  )

export default controller
