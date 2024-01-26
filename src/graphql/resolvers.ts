import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'

const resolvers = {
  Query: {
    async exchange (_: any, { name }: any) {
      return await Exchange.findOne({ name: name }).exec()
    }
  }
}

export default resolvers
