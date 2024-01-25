import dotenv from 'dotenv'
import express from 'express'
import { CronJob } from 'cron'

import appSetup from './startup/init.js'
import routerSetup from './startup/router.js'
import securitySetup from './startup/security.js'
import {
  collectCryptoBrokeragesPricesToDB,
  collectCryptoExchangesPricesToDB,
  collectCurrencyExchangesPricesToDB,
  collectP2POrdersToDB
} from './utils/pricing_collector/pricing_collector.js'
import { removeOlderPrices } from './services/exchanges.service.js'
import websocket from './startup/websocket/index.js'

dotenv.config()

const app = express()

appSetup(app)
  .then(server => {
    securitySetup(app, express)
    routerSetup(app)
    websocket(server)

    // Crypto rates collector interval
    setInterval(() => {
      collectCryptoExchangesPricesToDB().catch(reason => console.log(reason))
      collectCryptoBrokeragesPricesToDB().catch(reason => console.log(reason))
      collectP2POrdersToDB().catch(reason => console.log(reason))
    }, Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 1000 * 6))

    // Currency rates collector
    setInterval(() => {
      collectCurrencyExchangesPricesToDB().catch(reason => console.log(reason))
    }, Number(process.env.CURRENCY_COLLECTOR_INTERVAL ?? 1000 * 60))

    // Scheduled Jobs
    const removeOlderPricesJob = new CronJob(
      '0 * * * * *',
      function () {
        console.log('Deleting older prices...')
        removeOlderPrices()
      },
      null,
      true
    )
  })
  .catch(reason => {
    console.log(reason)
  })
