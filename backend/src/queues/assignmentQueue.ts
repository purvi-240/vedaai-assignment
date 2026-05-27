import { Queue } from 'bullmq'
import { bullmqConnection, isRedisAvailable } from '../config/redis.js'
import type { QuestionTypeConfig } from '../types/assignment.js'
import { processQuestionGeneration } from '../services/jobProcessor.js'

export const GENERATE_QUESTIONS_QUEUE = 'generate-questions'

export interface GenerateQuestionsJobData {
  assignmentId: string
  dueDate: string
  questionTypes: QuestionTypeConfig[]
  additionalInstructions: string
  referenceContent?: string
}

let generateQuestionsQueue: Queue<GenerateQuestionsJobData> | null = null

export function initAssignmentQueue(): void {
  if (!isRedisAvailable()) return

  generateQuestionsQueue = new Queue<GenerateQuestionsJobData>(
    GENERATE_QUESTIONS_QUEUE,
    { connection: bullmqConnection },
  )
}

export async function enqueueQuestionGeneration(
  data: GenerateQuestionsJobData,
): Promise<string> {
  if (generateQuestionsQueue) {
    const job = await generateQuestionsQueue.add('generate-questions', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    })
    return job.id ?? ''
  }

  setImmediate(() => {
    processQuestionGeneration(data).catch((error) => {
      console.error('Inline question generation failed:', error)
    })
  })

  return 'inline'
}
