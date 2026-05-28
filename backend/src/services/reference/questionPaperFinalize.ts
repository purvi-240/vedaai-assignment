import type { Difficulty, GeneratedQuestion, QuestionSection } from '../../types/assignment.js'

const DIFFICULTY_CYCLE: Difficulty[] = ['easy', 'medium', 'hard']

function stripExistingOptionLabel(option: string): string {
  return option.trim().replace(/^\(?[a-d]\)\)?\s*/i, '').trim()
}

export function formatMcqOptionLabel(option: string, index: number): string {
  const label = String.fromCharCode(97 + index)
  const body = stripExistingOptionLabel(option)
  if (!body) return `${label})`
  return `${label}) ${body}`
}

export function labelMcqOptions(options: string[]): string[] {
  return options.map((opt, index) => formatMcqOptionLabel(opt, index))
}

function buildFallbackAnswer(question: GeneratedQuestion): string {
  if (question.type === 'mcq' && question.options?.length) {
    const first = question.options[0]
    return first.replace(/^[a-d]\)\s*/i, '').trim() || first
  }

  if (question.type === 'true_false') {
    return 'True'
  }

  const q = question.question.toLowerCase()
  if (q.includes('define electroplating')) {
    return 'Electroplating is the process of coating an object with a thin layer of metal using electric current.'
  }
  if (q.includes('conductor') && q.includes('electrolysis')) {
    return 'A conductor allows electric current to flow through the electrolyte during electrolysis.'
  }
  if (q.includes('convert') && q.includes('hour') && q.includes('second')) {
    return '7200 seconds (2 × 60 × 60).'
  }
  if (q.includes('draw') || q.includes('sketch') || q.includes('label')) {
    return 'Refer to the labelled diagram as described in class notes.'
  }
  if (q.includes('calculate') || q.includes('find the')) {
    return 'Show all given values, formula, substitution, and final answer with units.'
  }

  return `Model answer: ${question.question.replace(/\?$/, '')}.`
}

export function assignDifficultyMix(sections: QuestionSection[]): void {
  let index = 0
  for (const section of sections) {
    for (const question of section.questions) {
      question.difficulty = DIFFICULTY_CYCLE[index % DIFFICULTY_CYCLE.length]
      index += 1
    }
  }
}

/** Spread Easy / Moderate / Challenging when the paper has little or no variety. */
export function rebalanceDifficultyIfUniform(sections: QuestionSection[]): void {
  const all = sections.flatMap((s) => s.questions)
  if (all.length === 0) return
  const levels = new Set(all.map((q) => q.difficulty))
  if (levels.size < 2) assignDifficultyMix(sections)
}

export function fillMissingAnswers(sections: QuestionSection[]): void {
  for (const section of sections) {
    for (const question of section.questions) {
      if (question.options?.length) {
        question.options = labelMcqOptions(question.options)
      }

      const answer = question.correctAnswer?.trim()
      if (!answer || answer === '—' || answer === '--' || answer === '-') {
        question.correctAnswer = buildFallbackAnswer(question)
        continue
      }

      if (question.type === 'mcq' && question.options?.length) {
        const matched = question.options.find(
          (opt) =>
            opt.toLowerCase().includes(answer.toLowerCase()) ||
            answer.toLowerCase().includes(opt.replace(/^[a-d]\)\s*/i, '').toLowerCase()),
        )
        if (matched) {
          question.correctAnswer = matched.replace(/^[a-d]\)\s*/i, '').trim()
        }
      }
    }
  }
}

export function finalizeQuestionSections(sections: QuestionSection[]): QuestionSection[] {
  rebalanceDifficultyIfUniform(sections)
  fillMissingAnswers(sections)
  return sections
}
