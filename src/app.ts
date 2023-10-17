import dotenv from 'dotenv'
import express from 'express'
import appSetup from './startup/init'
import routerSetup from './startup/router'
import securitySetup from './startup/security'
import { pricingCollector } from './startup/pricing_collector'

dotenv.config()

const app = express()

appSetup(app)
  .then(() => {
    securitySetup(app, express)
    routerSetup(app)
    // Pricing collection interval
    setInterval(() => {
      console.log('Collecting...')
      pricingCollector().catch(reason => {
        console.log(reason)
      })
    }, 6000)
  })
  .catch(reason => {
    console.log(reason)
  })
