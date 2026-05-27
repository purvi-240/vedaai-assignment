import mongoose, { Schema, type Document } from 'mongoose'
import type { GeneratedQuestion, QuestionSection } from '../types/assignment.js'

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId
  title: string
  sections: QuestionSection[]
  totalMarks: number
  createdAt: Date
  updatedAt: Date
}

const generatedQuestionSchema = new Schema<GeneratedQuestion>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    question: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    marks: { type: Number, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
  },
  { _id: false },
)

const questionSectionSchema = new Schema(
  {
    label: { type: String, required: true },
    title: { type: String, required: true },
    questions: { type: [generatedQuestionSchema], required: true },
  },
  { _id: false },
)

const questionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    title: { type: String, required: true },
    sections: { type: [questionSectionSchema], required: true },
    totalMarks: { type: Number, required: true },
  },
  { timestamps: true },
)

export const QuestionPaper = mongoose.model<IQuestionPaper>(
  'QuestionPaper',
  questionPaperSchema,
)
