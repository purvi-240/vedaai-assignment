import { z } from 'zod'
import { Assignment } from '../models/Assignment.js'
import { enqueueQuestionGeneration } from '../queues/assignmentQueue.js'
import { broadcast } from '../websocket/server.js'

const wsCreateSchema = z.object({
  dueDate: z.string().min(1),
  questionTypes: z
    .array(
      z.object({
        type: z.enum([
          'mcq',
          'true_false',
          'short_answer',
          'long_answer',
          'fill_in_blank',
          'diagram',
          'numerical',
        ]),
        count: z.number().int().positive(),
        marks: z.number().positive(),
      }),
    )
    .min(1),
  additionalInstructions: z.string().default(''),
  fileName: z.string().nullable().optional(),
})

export async function handleAssignmentCreate(payload: unknown): Promise<void> {
  const body = wsCreateSchema.parse(payload)

  const assignment = await Assignment.create({
    dueDate: new Date(body.dueDate),
    questionTypes: body.questionTypes,
    additionalInstructions: body.additionalInstructions,
    referenceFileName: body.fileName ?? undefined,
    status: 'pending',
  })

  const assignmentId = assignment._id.toString()

  await enqueueQuestionGeneration({
    assignmentId,
    dueDate: body.dueDate,
    questionTypes: body.questionTypes,
    additionalInstructions: body.additionalInstructions,
  })

  broadcast({
    type: 'assignment:created',
    payload: {
      assignmentId,
      status: 'pending',
      message: 'Assignment created. Question generation queued.',
    },
  })
}
