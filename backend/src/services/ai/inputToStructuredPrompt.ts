import type { QuestionType, QuestionTypeConfig } from '../../types/assignment.js'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface StructuredPromptSection {
  label: string
  title: string
  questionType: QuestionType
  count: number
  marksPerQuestion: number
  totalSectionMarks: number
}

export interface StructuredPrompt {
  dueDate: string
  additionalInstructions: string
  sections: StructuredPromptSection[]
  referenceMaterial?: string
  totalQuestions: number
  totalMarks: number
}

export interface PromptInput {
  dueDate: string
  questionTypes: QuestionTypeConfig[]
  additionalInstructions: string
  referenceContent?: string
}

const SECTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const QUESTION_TYPE_TITLES: Record<QuestionType, string> = {
  mcq: 'Multiple Choice Questions',
  true_false: 'True / False Questions',
  short_answer: 'Short Questions',
  long_answer: 'Long Answer Questions',
  fill_in_blank: 'Fill in the Blank Questions',
  diagram: 'Diagram/Graph-Based Questions',
  numerical: 'Numerical Problems',
}

export function inputToStructuredPrompt(input: PromptInput): StructuredPrompt {
  const sections: StructuredPromptSection[] = input.questionTypes.map((qt, index) => ({
    label: SECTION_LABELS[index] ?? `S${index + 1}`,
    title: QUESTION_TYPE_TITLES[qt.type],
    questionType: qt.type,
    count: qt.count,
    marksPerQuestion: qt.marks,
    totalSectionMarks: qt.count * qt.marks,
  }))

  const totalQuestions = sections.reduce((sum, section) => sum + section.count, 0)
  const totalMarks = sections.reduce((sum, section) => sum + section.totalSectionMarks, 0)

  return {
    dueDate: input.dueDate,
    additionalInstructions: input.additionalInstructions,
    sections,
    referenceMaterial: input.referenceContent?.slice(0, 4000),
    totalQuestions,
    totalMarks,
  }
}
