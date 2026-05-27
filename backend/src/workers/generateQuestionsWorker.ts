import { Worker, type Job } from 'bullmq'
import { bullmqConnection, initRedis, isRedisAvailable } from '../config/redis.js'
import { connectDatabase } from '../config/database.js'
import {
  GENERATE_QUESTIONS_QUEUE,
  type GenerateQuestionsJobData,
} from '../queues/assignmentQueue.js'
import { processQuestionGeneration } from '../services/jobProcessor.js'

async function processJob(job: Job<GenerateQuestionsJobData>): Promise<void> {
  await processQuestionGeneration(job.data)
}

async function startWorker(): Promise<void> {
  await connectDatabase()
  await initRedis()

  if (!isRedisAvailable()) {
    console.warn('Redis unavailable — worker not started (using inline processing in API server)')
    return
  }

  const worker = new Worker<GenerateQuestionsJobData>(
    GENERATE_QUESTIONS_QUEUE,
    processJob,
    { connection: bullmqConnection, concurrency: 2 },
  )

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
  })

  console.log('BullMQ worker started')
}

startWorker().catch(console.error)
