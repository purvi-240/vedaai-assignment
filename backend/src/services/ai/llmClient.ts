import OpenAI from 'openai'
import { env } from '../../config/env.js'
import type { QuestionSection } from '../../types/assignment.js'
import {
  inputToStructuredPrompt,
  type PromptInput,
  type StructuredPrompt,
  type StructuredPromptSection,
} from './inputToStructuredPrompt.js'
import { buildSectionGenerationPrompt } from './promptBuilder.js'
import { parseQuestionPaperResponse, parseSectionResponse } from './responseParser.js'
import { extractQuestionSeeds } from '../reference/referenceQuestionSeeds.js'
import { computeTotalMarksFromSections } from '../reference/computePaperTotals.js'
import {
  generatePaperFromReferenceWithLlm,
  shouldPreferReferencePaper,
  tryBuildPaperFromReference,
  type GeneratedPaperResult,
} from './generateFromReference.js'

const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null

const SECTION_LLM_TIMEOUT_MS = 90_000

export async function generateQuestionPaper(
  input: PromptInput,
): Promise<GeneratedPaperResult> {
  if (shouldPreferReferencePaper(input)) {
    const fromDocument = tryBuildPaperFromReference(input.referenceContent, input)
    if (fromDocument) {
      return fromDocument
    }

    if (openai) {
      const fromLlm = await generatePaperFromReferenceWithLlm(input)
      if (fromLlm) return fromLlm
    }
  }

  const structuredPrompt = inputToStructuredPrompt(input)

  if (!openai) {
    return parseQuestionPaperResponse(generateMockRawResponse(structuredPrompt))
  }

  const sections = await generateSectionsInParallel(structuredPrompt)

  return {
    title: derivePaperTitle(structuredPrompt),
    sections,
    totalMarks: computeTotalMarksFromSections(sections),
  }
}

async function generateSectionsInParallel(
  prompt: StructuredPrompt,
): Promise<QuestionSection[]> {
  const tasks = prompt.sections.map(async (section) => {
    const batches = splitSectionIntoBatches(section)
    const batchSections = await Promise.all(
      batches.map((batch) => generateSectionBatch(prompt, section, batch)),
    )
    return mergeSectionBatches(section, batchSections)
  })

  return Promise.all(tasks)
}

function splitSectionIntoBatches(
  section: StructuredPromptSection,
): Array<{ startIndex: number; count: number }> {
  const maxPerBatch = 6
  if (section.count <= maxPerBatch) {
    return [{ startIndex: 0, count: section.count }]
  }

  const batches: Array<{ startIndex: number; count: number }> = []
  let remaining = section.count
  let startIndex = 0

  while (remaining > 0) {
    const count = Math.min(maxPerBatch, remaining)
    batches.push({ startIndex, count })
    startIndex += count
    remaining -= count
  }

  return batches
}

async function generateSectionBatch(
  prompt: StructuredPrompt,
  section: StructuredPromptSection,
  batch: { startIndex: number; count: number },
): Promise<QuestionSection> {
  const batchSection: StructuredPromptSection = {
    ...section,
    count: batch.count,
    totalSectionMarks: batch.count * section.marksPerQuestion,
  }

  const llmPrompt = buildSectionBatchPrompt(prompt, section, batchSection, batch.startIndex)
  const rawResponse = await callLLM(llmPrompt, batch.count)
  const parsed = parseSectionResponse(rawResponse, {
    label: section.label,
    count: batch.count,
  })

  return renumberSectionQuestions(parsed, batch.startIndex)
}

function buildSectionBatchPrompt(
  prompt: StructuredPrompt,
  fullSection: StructuredPromptSection,
  batchSection: StructuredPromptSection,
  startIndex: number,
): string {
  const base = buildSectionGenerationPrompt(prompt, batchSection)
  if (batchSection.count === fullSection.count) return base

  const firstId = `${fullSection.label}${startIndex + 1}`
  return `${base}

This is a partial batch of Section ${fullSection.label}. Start question numbering at ${firstId}.`
}

function renumberSectionQuestions(section: QuestionSection, startIndex: number): QuestionSection {
  if (startIndex === 0) return section

  return {
    ...section,
    questions: section.questions.map((question, index) => ({
      ...question,
      id: `${section.label}${startIndex + index + 1}`,
    })),
  }
}

function mergeSectionBatches(
  section: StructuredPromptSection,
  batches: QuestionSection[],
): QuestionSection {
  if (batches.length === 1) return batches[0]

  return {
    label: section.label,
    title: section.title,
    questions: batches.flatMap((batch) => batch.questions),
  }
}

async function callLLM(prompt: string, questionCount: number): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SECTION_LLM_TIMEOUT_MS)

  try {
    const completion = await openai!.chat.completions.create(
      {
        model: env.LLM_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an assessment generator. Always respond with valid JSON only. Be concise in question wording.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: Math.min(4096, questionCount * 220 + 120),
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal },
    )

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from LLM')
    }

    return content
  } finally {
    clearTimeout(timeout)
  }
}

function derivePaperTitle(prompt: StructuredPrompt): string {
  const trimmed = prompt.additionalInstructions.trim()
  if (trimmed.length > 0 && trimmed.length <= 80) {
    return trimmed
  }

  const sectionNames = prompt.sections.map((s) => s.title).join(' · ')
  return sectionNames.length > 0 ? sectionNames.slice(0, 120) : 'Generated Assessment'
}

function pickQuestionText(
  seeds: string[],
  seedIndex: { value: number },
  sectionTitle: string,
  questionNumber: number,
): string {
  if (seeds.length > 0) {
    const text = seeds[seedIndex.value % seeds.length]
    seedIndex.value += 1
    return text
  }

  return `Sample ${sectionTitle.replace(/ Questions$/, '')} question ${questionNumber}`
}

function generateMockRawResponse(prompt: StructuredPrompt): string {
  const difficulties = ['easy', 'medium', 'hard'] as const
  const seeds = prompt.referenceMaterial ? extractQuestionSeeds(prompt.referenceMaterial) : []
  const seedIndex = { value: 0 }

  const sections = prompt.sections.map((section) => ({
    label: section.label,
    title: section.title,
    questions: Array.from({ length: section.count }, (_, index) => {
      const difficulty = difficulties[index % difficulties.length]
      const questionNumber = index + 1
      const questionText = pickQuestionText(seeds, seedIndex, section.title, questionNumber)

      return {
        id: `${section.label}${questionNumber}`,
        type: section.questionType,
        question: questionText,
        difficulty,
        marks: section.marksPerQuestion,
        options:
          section.questionType === 'mcq'
            ? ['Option A', 'Option B', 'Option C', 'Option D']
            : undefined,
        correctAnswer:
          section.questionType === 'mcq'
            ? 'Option A'
            : section.questionType === 'true_false'
              ? 'True'
              : `Model answer: ${questionText.slice(0, 200)}`,
      }
    }),
  }))

  const title =
    seeds.length > 0 ? 'Assessment from uploaded document' : 'Generated Assessment'

  return JSON.stringify({
    title,
    sections,
    totalMarks: prompt.totalMarks,
  })
}
