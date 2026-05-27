import mongoose, { Schema, type Document } from 'mongoose'
import type { AssignmentStatus, QuestionTypeConfig } from '../types/assignment.js'

export interface IAssignment extends Document {
  dueDate: Date
  questionTypes: QuestionTypeConfig[]
  additionalInstructions: string
  referenceFileName?: string
  status: AssignmentStatus
  questionPaper?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const questionTypeConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'mcq',
        'true_false',
        'short_answer',
        'long_answer',
        'fill_in_blank',
        'diagram',
        'numerical',
      ],
      required: true,
    },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 0.5 },
  },
  { _id: false },
)

const assignmentSchema = new Schema<IAssignment>(
  {
    dueDate: { type: Date, required: true },
    questionTypes: { type: [questionTypeConfigSchema], required: true },
    additionalInstructions: { type: String, default: '' },
    referenceFileName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
    },
    questionPaper: { type: Schema.Types.ObjectId, ref: 'QuestionPaper' },
  },
  { timestamps: true },
)

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema)
