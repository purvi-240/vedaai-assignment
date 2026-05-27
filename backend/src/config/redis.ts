import Redis from 'ioredis'
import { env } from './env.js'

export const WS_BROADCAST_CHANNEL = 'ws:broadcast'

export const bullmqConnection = {
  url: env.REDIS_URL,
}

type RedisClient = InstanceType<typeof Redis.default>

let redisConnection: RedisClient | null = null
let redisPublisher: RedisClient | null = null
let redisReady = false

export async function initRedis(): Promise<boolean> {
  if (redisReady) return true

  try {
    redisConnection = new Redis.default(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: () => null,
    })

    redisPublisher = new Redis.default(env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: () => null,
    })

    await redisConnection.connect()
    await redisPublisher.connect()

    redisConnection.on('error', (err: Error) => {
      console.error('Redis error:', err.message)
    })

    redisReady = true
    console.log(`Redis connected (${env.REDIS_URL})`)
    return true
  } catch {
    redisConnection?.disconnect()
    redisPublisher?.disconnect()
    redisConnection = null
    redisPublisher = null
    redisReady = false
    console.warn('Redis unavailable — using in-process job processing')
    return false
  }
}

export function isRedisAvailable(): boolean {
  return redisReady
}

export function getRedisConnection(): RedisClient | null {
  return redisConnection
}

export function getRedisPublisher(): RedisClient | null {
  return redisPublisher
}
