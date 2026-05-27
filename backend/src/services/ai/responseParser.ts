import { z } from 'zod'
import type { GeneratedQuestionPaper } from '../../types/assignment.js'

const difficultySchema = z.enum(['easy', 'medium', 'hard'])

const generatedQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'mcq',
    'true_false',
    'short_answer',
    'long_answer',
    'fill_in_blank',
    'diagram',
    'numerical',
  ]),
  question: z.string().min(1),
  difficulty: difficultySchema,
  marks: z.number().positive(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
})

const questionSectionSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(1),
})

const questionPaperSchema = z.object({
  title: z.string().min(1),
  sections: z.array(questionSectionSchema).min(1),
  totalMarks: z.number().positive(),
})

export function parseQuestionPaperResponse(raw: string): GeneratedQuestionPaper {
  const cleaned = extractJson(raw)
  const parsed = JSON.parse(cleaned) as unknown
  const validated = questionPaperSchema.parse(parsed)

  return normalizeQuestionPaper(validated)
}

function normalizeQuestionPaper(
  paper: z.infer<typeof questionPaperSchema>,
): GeneratedQuestionPaper {
  const sections = paper.sections.map((section) => ({
    label: section.label,
    title: section.title,
    questions: section.questions.map((question) => ({
      id: question.id,
      type: question.type,
      question: question.question,
      difficulty: question.difficulty,
      marks: question.marks,
      options: question.options,
      correctAnswer: question.correctAnswer,
    })),
  }))

  const computedTotalMarks = sections.reduce(
    (total, section) =>
      total + section.questions.reduce((sectionTotal, q) => sectionTotal + q.marks, 0),
    0,
  )

  return {
    title: paper.title,
    sections,
    totalMarks: computedTotalMarks,
  }
}

function extractJson(raw: string): string {
  const trimmed = raw.trim()

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim()
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch?.[0]) {
    return objectMatch[0]
  }

  return trimmed
}
