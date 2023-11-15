import dotenv from 'dotenv'
import express from 'express'

import appSetup from './startup/init.js'
import routerSetup from './startup/router.js'
import securitySetup from './startup/security.js'
import { arbitrageCollector } from './startup/pricing_collector.js'

dotenv.config()

const app = express()

appSetup(app)
  .then(() => {
    securitySetup(app, express)
    routerSetup(app)
    // Pricing collection interval
    setInterval(() => {
      arbitrageCollector().catch(reason => {
        console.log(reason)
      })
    }, Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 6000))
  })
  .catch(reason => {
    console.log(reason)
  })
