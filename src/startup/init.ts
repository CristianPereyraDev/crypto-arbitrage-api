import { type Express } from 'express'
import mongooseConnect from '../databases/mongodb/mongodb'

const appSetup = async (app: Express): Promise<void> => {
  // set database connections
  try {
    await mongooseConnect()
    console.log('Database connected successfully!')

    const APP_PORT =
      process.env.APP_PORT !== undefined ? Number(process.env.APP_PORT) : 3000

    app.listen(APP_PORT, () => {
      console.log(`Server started on port ${APP_PORT}`)
    })
  } catch (error) {
    console.log('Unable to start the app!')
    console.log(error)
  }
}

export default appSetup
