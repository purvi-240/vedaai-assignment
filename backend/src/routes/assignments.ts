import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import mongoose from 'mongoose'
import { Assignment } from '../models/Assignment.js'
import { QuestionPaper } from '../models/QuestionPaper.js'
import { enqueueQuestionGeneration } from '../queues/assignmentQueue.js'
import { parseDueDate } from '../utils/parseDueDate.js'
import { broadcast } from '../websocket/server.js'
import { generateQuestionPaperPdf } from '../services/pdf/questionPaperPdf.js'
import type { GeneratedQuestionPaper } from '../types/assignment.js'
import { resolveReferenceContent } from '../services/reference/resolveReferenceContent.js'
import { ReferenceExtractError } from '../services/reference/extractReferenceText.js'
import {
  getQuestionPaperByAssignmentId,
  isValidAssignmentId,
} from '../services/questionPaperLookup.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

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
  referenceContent: z.string().max(12000).optional(),
})

const renderPdfBodySchema = z.object({
  title: z.string().min(1),
  sections: z.array(z.unknown()).min(1),
  totalMarks: z.number().optional(),
  schoolName: z.string().optional(),
  subject: z.string().optional(),
  classLabel: z.string().optional(),
  timeAllowed: z.string().optional(),
})

export const assignmentsRouter = Router()

assignmentsRouter.get('/', async (_req, res) => {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select('_id dueDate status referenceFileName createdAt')
      .lean()

    res.json({
      success: true,
      data: assignments.map((assignment) => ({
        id: assignment._id.toString(),
        title:
          assignment.referenceFileName?.replace(/\.[^.]+$/i, '') ||
          'Generated Assignment',
        status: assignment.status,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
      })),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

assignmentsRouter.post('/', upload.single('referenceFile'), async (req, res) => {
  try {
    const rawBody =
      typeof req.body.metadata === 'string'
        ? (JSON.parse(req.body.metadata) as unknown)
        : req.body

    const body = createAssignmentSchema.parse(rawBody)

    const referenceContent = await resolveReferenceContent({
      referenceContent: body.referenceContent,
      file: req.file
        ? {
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
          }
        : undefined,
    })

    if (req.file && !referenceContent) {
      res.status(400).json({
        success: false,
        error:
          'Could not read any text from the uploaded file. Use a text PDF, a clear photo (JPEG/PNG), or paste questions in Additional Instructions.',
      })
      return
    }

    const assignment = await Assignment.create({
      dueDate: parseDueDate(body.dueDate),
      questionTypes: body.questionTypes,
      additionalInstructions: body.additionalInstructions,
      referenceFileName: body.referenceFileName ?? req.file?.originalname,
      referenceExcerpt: referenceContent?.slice(0, 4000),
      status: 'pending',
    })

    await enqueueQuestionGeneration({
      assignmentId: assignment._id.toString(),
      dueDate: body.dueDate,
      questionTypes: body.questionTypes,
      additionalInstructions: body.additionalInstructions,
      referenceContent,
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
    if (error instanceof ReferenceExtractError) {
      res.status(400).json({ success: false, error: error.message })
      return
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

assignmentsRouter.delete('/:id', async (req, res) => {
  try {
    if (!isValidAssignmentId(req.params.id)) {
      res.status(400).json({ success: false, error: 'Invalid assignment id' })
      return
    }

    const assignmentOid = new mongoose.Types.ObjectId(req.params.id)
    await QuestionPaper.deleteMany({ assignmentId: assignmentOid })

    const deleted = await Assignment.findByIdAndDelete(req.params.id)
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Assignment not found' })
      return
    }

    res.json({ success: true })
  } catch (error) {
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
    if (!isValidAssignmentId(req.params.id)) {
      res.status(400).json({ success: false, error: 'Invalid assignment id' })
      return
    }

    const assignment = await Assignment.findById(req.params.id).select('status').lean()
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' })
      return
    }

    if (assignment.status === 'pending' || assignment.status === 'generating') {
      res.status(202).json({
        success: false,
        error: 'Question paper is still being generated',
        status: assignment.status,
      })
      return
    }

    if (assignment.status === 'failed') {
      res.status(422).json({
        success: false,
        error: 'Question generation failed for this assignment',
        status: assignment.status,
      })
      return
    }

    const paper = await getQuestionPaperByAssignmentId(req.params.id)

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

assignmentsRouter.get('/:id/question-paper/pdf', async (req, res) => {
  try {
    if (!isValidAssignmentId(req.params.id)) {
      res.status(400).json({ success: false, error: 'Invalid assignment id' })
      return
    }

    const paper = await getQuestionPaperByAssignmentId(req.params.id)

    if (!paper) {
      res.status(404).json({ success: false, error: 'Question paper not found' })
      return
    }

    const buffer = await generateQuestionPaperPdf(paper)

    const safeName =
      paper.title
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || `question-paper-${req.params.id}`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`)
    res.send(buffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

/** Generate PDF from a question-paper payload (used when DB was reset but client has a cache). */
assignmentsRouter.post('/question-paper/pdf', async (req, res) => {
  try {
    const body = renderPdfBodySchema.parse(req.body)
    const buffer = await generateQuestionPaperPdf(body as GeneratedQuestionPaper)

    const safeName =
      body.title
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'question-paper'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`)
    res.send(buffer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid question paper data' })
      return
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})
