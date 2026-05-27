import { Assignment } from '../models/Assignment.js'
import { QuestionPaper } from '../models/QuestionPaper.js'
import { generateQuestionPaper } from '../services/ai/llmClient.js'
import type { GenerateQuestionsJobData } from '../queues/assignmentQueue.js'
import { publishBroadcast } from '../websocket/publisher.js'

export async function processQuestionGeneration(
  data: GenerateQuestionsJobData,
): Promise<void> {
  const { assignmentId, dueDate, questionTypes, additionalInstructions, referenceContent } =
    data

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' })

  await publishBroadcast(
    { type: 'assignment:status', payload: { assignmentId, status: 'generating' } },
    assignmentId,
  )

  try {
    const paper = await generateQuestionPaper({
      dueDate,
      questionTypes,
      additionalInstructions,
      referenceContent,
    })

    const savedPaper = await QuestionPaper.create({
      assignmentId,
      title: paper.title,
      sections: paper.sections,
      totalMarks: paper.totalMarks,
    })

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      questionPaper: savedPaper._id,
    })

    await publishBroadcast(
      {
        type: 'assignment:completed',
        payload: {
          assignmentId,
          questionPaper: savedPaper.toObject(),
        },
      },
      assignmentId,
    )
  } catch (error) {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' })

    await publishBroadcast(
      {
        type: 'assignment:failed',
        payload: {
          assignmentId,
          error: error instanceof Error ? error.message : 'Generation failed',
        },
      },
      assignmentId,
    )

    throw error
  }
}
