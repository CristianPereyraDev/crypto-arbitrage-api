import { createClient } from 'redis';

export type RedisType = ReturnType<typeof createClient>;

export async function redisConnection(url?: string): Promise<RedisType> {
  const redis = await createClient({ url })
    .on('error', (err) => {
      console.log('Redis Client Error', err);
    })
    .connect();

  return redis;
}
