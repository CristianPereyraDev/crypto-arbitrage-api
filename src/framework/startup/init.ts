import { type Express } from 'express';
import { Server } from 'http';
import NodeCache from 'node-cache';

import mongooseConnect from '../../databases/mongodb/mongodb.js';
// import {
//   redisConnection,
//   RedisType,
// } from '../../databases/redis/redis-client.js';

type AppSetupResult = {
  server: Server;
  nodeCache: NodeCache;
};

const appSetup = async (app: Express): Promise<AppSetupResult> => {
  try {
    // node-cache
    const nodeCache = new NodeCache({ stdTTL: 60 });
    // Redis connection
    //const redis = await redisConnection(process.env.REDIS_URL);
    // Set database connection
    const mongoClient = await mongooseConnect();

    const APP_PORT =
      process.env.PORT !== undefined ? Number(process.env.PORT) : 3000;

    const server = app.listen(APP_PORT, () => {
      console.log(`Server started on port ${APP_PORT}`);
    });

    server.setTimeout(5000, () => {
      console.log("An socket's timeout");
    });

    return { server, nodeCache };
  } catch (error) {
    throw new Error('Unable to start the app!');
  }
};

export default appSetup;
