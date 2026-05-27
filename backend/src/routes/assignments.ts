import { Router } from 'express'
import { z } from 'zod'
import { Assignment } from '../models/Assignment.js'
import { QuestionPaper } from '../models/QuestionPaper.js'
import { enqueueQuestionGeneration } from '../queues/assignmentQueue.js'
import { broadcast } from '../websocket/server.js'

const createAssignmentSchema = z.object({
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
  referenceFileName: z.string().optional(),
})

export const assignmentsRouter = Router()

assignmentsRouter.post('/', async (req, res) => {
  try {
    const body = createAssignmentSchema.parse(req.body)

    const assignment = await Assignment.create({
      dueDate: new Date(body.dueDate),
      questionTypes: body.questionTypes,
      additionalInstructions: body.additionalInstructions,
      referenceFileName: body.referenceFileName,
      status: 'pending',
    })

    await enqueueQuestionGeneration({
      assignmentId: assignment._id.toString(),
      dueDate: body.dueDate,
      questionTypes: body.questionTypes,
      additionalInstructions: body.additionalInstructions,
    })

    broadcast({
      type: 'assignment:created',
      payload: { assignment: assignment.toObject() },
    })

    res.status(201).json({ success: true, data: assignment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.issues })
      return
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

assignmentsRouter.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('questionPaper')

    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' })
      return
    }

    res.json({ success: true, data: assignment })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

assignmentsRouter.get('/:id/question-paper', async (req, res) => {
  try {
    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id })

    if (!paper) {
      res.status(404).json({ success: false, error: 'Question paper not found' })
      return
    }

    res.json({ success: true, data: paper })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})
