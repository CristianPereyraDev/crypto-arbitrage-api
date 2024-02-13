import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'

const resolvers = {
  Query: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async exchange(_: any, { name }: any) {
      return await Exchange.findOne({ name: name }).exec()
    }
  }
}

export default resolvers
