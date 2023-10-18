import { connect } from 'mongoose'

export default async function mongooseConnect (): Promise<string> {
  const mongoDBURI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

  await connect(mongoDBURI)

  return mongoDBURI
}
