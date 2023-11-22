import dotenv from 'dotenv'
import express from 'express'

import appSetup from './startup/init.js'
import routerSetup from './startup/router.js'
import securitySetup from './startup/security.js'
import {
  collectArbitragesToDB,
  collectExchangesPricesToBD
} from './startup/pricing_collector.js'
import {
  getSpotAskBidPrices,
  getP2POrders,
  getP2PAskBidPrices
} from './utils/apis/exchanges/binance.js'
import { getBitgetPairPrices } from './utils/apis/exchanges/bitget.js'
import { performScraping } from './utils/scraping/cryptoya.js'

dotenv.config()

const app = express()

appSetup(app)
  .then(() => {
    securitySetup(app, express)
    routerSetup(app)
    // Pricing collection interval
    // setInterval(() => {
    //   collectArbitragesToDB().catch(reason => {
    //     console.log(reason)
    //   })
    //   collectExchangesPricesToBD().catch(reason => console.log(reason))
    // }, Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 6000))
  })
  .catch(reason => {
    console.log(reason)
  })
