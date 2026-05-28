import { Worker, type Job } from 'bullmq'
import { bullmqConnection, isRedisAvailable } from '../config/redis.js'
import {
  GENERATE_QUESTIONS_QUEUE,
  type GenerateQuestionsJobData,
} from './assignmentQueue.js'
import { processQuestionGeneration } from '../services/jobProcessor.js'

let activeWorker: Worker<GenerateQuestionsJobData> | null = null

async function processJob(job: Job<GenerateQuestionsJobData>): Promise<void> {
  await processQuestionGeneration(job.data)
}

/** Process queued jobs in-process (dev-friendly; safe alongside a standalone worker). */
export function startGenerateQuestionsWorker(): Worker<GenerateQuestionsJobData> | null {
  if (!isRedisAvailable() || activeWorker) {
    return activeWorker
  }

  activeWorker = new Worker<GenerateQuestionsJobData>(GENERATE_QUESTIONS_QUEUE, processJob, {
    connection: bullmqConnection,
    concurrency: 2,
  })

  activeWorker.on('completed', (job) => {
    console.log(`Question generation job ${job.id} completed`)
  })

  activeWorker.on('failed', (job, err) => {
    console.error(`Question generation job ${job?.id} failed:`, err.message)
  })

  console.log('BullMQ question-generation worker started (in API process)')
  return activeWorker
}

export async function stopGenerateQuestionsWorker(): Promise<void> {
  if (!activeWorker) return
  await activeWorker.close()
  activeWorker = null
}
