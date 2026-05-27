import OpenAI from 'openai'
import { env } from '../../config/env.js'
import type { GeneratedQuestionPaper } from '../../types/assignment.js'
import {
  inputToStructuredPrompt,
  type PromptInput,
} from './inputToStructuredPrompt.js'
import { buildQuestionGenerationPrompt } from './promptBuilder.js'
import { parseQuestionPaperResponse } from './responseParser.js'

const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null

export async function generateQuestionPaper(
  input: PromptInput,
): Promise<GeneratedQuestionPaper> {
  const structuredPrompt = inputToStructuredPrompt(input)
  const llmPrompt = buildQuestionGenerationPrompt(structuredPrompt)

  const rawResponse = openai
    ? await callLLM(llmPrompt)
    : generateMockRawResponse(structuredPrompt)

  return parseQuestionPaperResponse(rawResponse)
}

async function callLLM(prompt: string): Promise<string> {
  const completion = await openai!.chat.completions.create({
    model: env.LLM_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are an assessment generator. Always respond with valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from LLM')
  }

  return content
}

function generateMockRawResponse(
  prompt: ReturnType<typeof inputToStructuredPrompt>,
): string {
  const difficulties = ['easy', 'medium', 'hard'] as const

  const sections = prompt.sections.map((section) => ({
    label: section.label,
    title: section.title,
    questions: Array.from({ length: section.count }, (_, index) => {
      const difficulty = difficulties[index % difficulties.length]
      const questionNumber = index + 1

      return {
        id: `${section.label}${questionNumber}`,
        type: section.questionType,
        question: `[${difficulty.toUpperCase()}] Sample ${section.title.replace(/ Questions$/, '')} question ${questionNumber}`,
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
              : undefined,
      }
    }),
  }))

  return JSON.stringify({
    title: 'Generated Assessment',
    sections,
    totalMarks: prompt.totalMarks,
  })
}
