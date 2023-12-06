import { type Express } from 'express'
import mongooseConnect from '../databases/mongodb/mongodb.js'

const appSetup = async (app: Express): Promise<void> => {
  try {
    // Set database connection
    const databaseURI = await mongooseConnect()

    const APP_PORT =
      process.env.PORT !== undefined ? Number(process.env.PORT) : 3000

    app.listen(APP_PORT, () => {
      console.log(`Server started on port ${APP_PORT}`)
    })
  } catch (error) {
    console.log('Unable to start the app!')
    console.log(error)
  }
}

export default appSetup
