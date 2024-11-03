import { type Express } from 'express';
import mongooseConnect from '../../databases/mongodb/mongodb.js';
import { Server } from 'http';
import {
  redisConnection,
  RedisType,
} from '../../databases/redis/redis-client.js';

const appSetup = async (
  app: Express
): Promise<{ server: Server; redis: RedisType }> => {
  try {
    // Redis connection
    const redis = await redisConnection(process.env.REDIS_URL);
    // Set database connection
    await mongooseConnect();

    const APP_PORT =
      process.env.PORT !== undefined ? Number(process.env.PORT) : 3000;

    const server = app.listen(APP_PORT, () => {
      console.log(`Server started on port ${APP_PORT}`);
    });

    server.setTimeout(5000, () => {
      console.log("An socket's timeout");
    });

    return { server, redis };
  } catch (error) {
    throw new Error('Unable to start the app!');
  }
};

export default appSetup;
