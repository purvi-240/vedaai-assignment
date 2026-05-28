import type { GeneratedQuestion, GeneratedQuestionPaper } from '../../types/assignment.js'
import {
  paperFromParsedReference,
  parseReferenceDocument,
} from '../reference/parseReferenceDocument.js'
import { extractQuestionSeeds } from '../reference/referenceQuestionSeeds.js'
import { labelMcqOptions } from '../reference/questionPaperFinalize.js'
import { computeTotalMarksFromSections } from '../reference/computePaperTotals.js'
import type { PromptInput } from './inputToStructuredPrompt.js'
import { inputToStructuredPrompt } from './inputToStructuredPrompt.js'
import { parseQuestionPaperResponse } from './responseParser.js'
import { buildReferenceToPaperPrompt } from './promptBuilder.js'
import OpenAI from 'openai'
import { env } from '../../config/env.js'

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null

const MIN_REFERENCE_CHARS = 180

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export type GeneratedPaperResult = GeneratedQuestionPaper & {
  schoolName?: string
  subject?: string
  classLabel?: string
  timeAllowed?: string
}

/** Use form section counts/marks; fill question text from the uploaded document. */
function buildPaperFromReferenceWithFormConfig(
  referenceContent: string,
  input: PromptInput,
): GeneratedPaperResult | null {
  const parsed = parseReferenceDocument(referenceContent)
  const structured = inputToStructuredPrompt(input)
  const pdfQuestions = parsed?.sections.flatMap((section) => section.questions) ?? []
  const seeds =
    pdfQuestions.length > 0
      ? pdfQuestions.map((q) => q.question)
      : extractQuestionSeeds(referenceContent)

  let seedIndex = 0
  let pdfIndex = 0

  const sections = structured.sections.map((section) => ({
    label: section.label,
    title: section.title,
    questions: Array.from({ length: section.count }, (_, index) => {
      const fromPdf = pdfQuestions[pdfIndex]
      pdfIndex += 1

      let questionText = fromPdf?.question
      if (!questionText && seeds.length > 0) {
        questionText = seeds[seedIndex % seeds.length]
        seedIndex += 1
      }
      if (!questionText) {
        questionText = `Question ${index + 1}`
      }

      const difficulty =
        fromPdf?.difficulty ?? DIFFICULTIES[(index + section.label.charCodeAt(0)) % DIFFICULTIES.length]

      const question: GeneratedQuestion = {
        id: `${section.label}${index + 1}`,
        type: section.questionType,
        question: questionText,
        difficulty,
        marks: section.marksPerQuestion,
        correctAnswer: fromPdf?.correctAnswer,
      }

      if (section.questionType === 'mcq' && fromPdf?.options?.length) {
        question.options = labelMcqOptions(fromPdf.options)
      } else if (section.questionType === 'mcq') {
        question.options = labelMcqOptions(['Option A', 'Option B', 'Option C', 'Option D'])
      }

      return question
    }),
  }))

  const totalMarks = computeTotalMarksFromSections(sections)
  const meta = parsed?.meta

  return {
    title: `${meta?.subject ?? 'Assessment'} — Class ${meta?.classLabel ?? ''}`.trim(),
    sections,
    totalMarks,
    schoolName: meta?.schoolName,
    subject: meta?.subject,
    classLabel: meta?.classLabel,
    timeAllowed: meta?.timeAllowed,
  }
}

export function tryBuildPaperFromReference(
  referenceContent: string | undefined,
  input: PromptInput,
): GeneratedPaperResult | null {
  if (!referenceContent || referenceContent.trim().length < MIN_REFERENCE_CHARS) {
    return null
  }

  if (input.questionTypes.length > 0) {
    return buildPaperFromReferenceWithFormConfig(referenceContent, input)
  }

  const parsed = parseReferenceDocument(referenceContent)
  if (!parsed || parsed.sections.every((s) => s.questions.length === 0)) {
    return null
  }

  const paper = paperFromParsedReference(parsed)
  const totalMarks = computeTotalMarksFromSections(paper.sections)

  return {
    title: paper.title,
    sections: paper.sections,
    totalMarks,
    schoolName: paper.meta.schoolName,
    subject: paper.meta.subject,
    classLabel: paper.meta.classLabel,
    timeAllowed: paper.meta.timeAllowed,
  }
}

export async function generatePaperFromReferenceWithLlm(
  input: PromptInput,
): Promise<GeneratedPaperResult | null> {
  if (!openai || !input.referenceContent?.trim()) return null

  const prompt = buildReferenceToPaperPrompt(
    input.referenceContent,
    input.additionalInstructions,
    input,
  )

  const completion = await openai.chat.completions.create({
    model: env.LLM_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You convert teacher reference documents into assessment JSON. Follow the section counts and marks from the assignment configuration exactly.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) return null

  const paper = parseQuestionPaperResponse(content)
  const totalMarks = computeTotalMarksFromSections(paper.sections)
  const parsed = parseReferenceDocument(input.referenceContent)

  return {
    ...paper,
    totalMarks,
    schoolName: parsed?.meta.schoolName,
    subject: parsed?.meta.subject,
    classLabel: parsed?.meta.classLabel,
    timeAllowed: parsed?.meta.timeAllowed,
  }
}

export function shouldPreferReferencePaper(input: PromptInput): boolean {
  return Boolean(input.referenceContent && input.referenceContent.trim().length >= MIN_REFERENCE_CHARS)
}
