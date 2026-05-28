import { connectDatabase } from '../config/database.js'
import { initRedis, isRedisAvailable } from '../config/redis.js'
import { startGenerateQuestionsWorker } from '../queues/generateQuestionsWorkerRunner.js'

async function startWorker(): Promise<void> {
  await connectDatabase()
  await initRedis()

  if (!isRedisAvailable()) {
    console.warn('Redis unavailable — worker not started (using inline processing in API server)')
    return
  }

  startGenerateQuestionsWorker()
}

startWorker().catch(console.error)
