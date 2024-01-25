import mongoose from 'mongoose'

export default async function mongooseConnect (): Promise<mongoose.mongo.MongoClient> {
  const mongoDBURI = process.env.MONGODB_URI_PROD ?? 'mongodb://localhost:27017'

  const conn = await mongoose.connect(mongoDBURI)

  return conn.connection.getClient()
}
