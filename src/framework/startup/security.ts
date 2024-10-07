import cors from 'cors'
import { type Express } from 'express'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const securitySetup = (app: Express, express: any): Express =>
  app.use(cors()).use(express.json())

export default securitySetup
