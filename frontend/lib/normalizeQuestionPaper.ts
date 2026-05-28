export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GeneratedQuestion {
  id: string
  question: string
  difficulty: Difficulty
  marks: number
  options?: string[]
  correctAnswer?: string
}

export interface QuestionSection {
  label: string
  title: string
  questions: GeneratedQuestion[]
}

export interface QuestionPaper {
  title: string
  sections: QuestionSection[]
  totalMarks: number
  schoolName?: string
  subject?: string
  classLabel?: string
  timeAllowed?: string
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard'
}

function normalizeQuestion(raw: unknown, fallbackId: string): GeneratedQuestion | null {
  if (!raw || typeof raw !== 'object') return null
  const q = raw as Record<string, unknown>
  const questionText = typeof q.question === 'string' ? q.question.trim() : ''
  if (!questionText) return null

  const marks = typeof q.marks === 'number' ? q.marks : Number(q.marks)
  if (!Number.isFinite(marks) || marks <= 0) return null

  const difficulty = isDifficulty(q.difficulty) ? q.difficulty : 'medium'

  return {
    id: typeof q.id === 'string' && q.id.length > 0 ? q.id : fallbackId,
    question: questionText,
    difficulty,
    marks,
    options: Array.isArray(q.options)
      ? q.options.filter((opt): opt is string => typeof opt === 'string' && opt.length > 0)
      : undefined,
    correctAnswer:
      typeof q.correctAnswer === 'string' && q.correctAnswer.trim().length > 0
        ? q.correctAnswer.trim()
        : undefined,
  }
}

function normalizeSection(raw: unknown, index: number): QuestionSection | null {
  if (!raw || typeof raw !== 'object') return null
  const section = raw as Record<string, unknown>
  const label =
    typeof section.label === 'string' && section.label.length > 0
      ? section.label
      : String.fromCharCode(65 + index)
  const title =
    typeof section.title === 'string' && section.title.length > 0
      ? section.title
      : `Section ${label}`

  const rawQuestions = Array.isArray(section.questions) ? section.questions : []
  const questions = rawQuestions
    .map((question, qIndex) => normalizeQuestion(question, `${label}${qIndex + 1}`))
    .filter((question): question is GeneratedQuestion => question !== null)

  if (questions.length === 0) return null

  return { label, title, questions }
}

/** Accepts API/Mongoose payloads and returns a stable shape for the output UI. */
export function normalizeQuestionPaper(raw: unknown): QuestionPaper | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>

  const rawSections = Array.isArray(data.sections) ? data.sections : []
  const sections = rawSections
    .map((section, index) => normalizeSection(section, index))
    .filter((section): section is QuestionSection => section !== null)

  if (sections.length === 0) return null

  const computedMarks = sections.reduce(
    (total, section) =>
      total + section.questions.reduce((sectionTotal, q) => sectionTotal + q.marks, 0),
    0,
  )

  const totalMarks = computedMarks > 0 ? computedMarks : typeof data.totalMarks === 'number' ? data.totalMarks : 0

  const title =
    typeof data.title === 'string' && data.title.trim().length > 0
      ? data.title.trim()
      : 'Generated Question Paper'

  const timeAllowed =
    typeof data.timeAllowed === 'string'
      ? data.timeAllowed.replace(/\s*Maximum\s*Marks.*$/i, '').trim()
      : undefined

  return {
    title,
    sections,
    totalMarks,
    schoolName: typeof data.schoolName === 'string' ? data.schoolName : undefined,
    subject: typeof data.subject === 'string' ? data.subject : undefined,
    classLabel: typeof data.classLabel === 'string' ? data.classLabel : undefined,
    timeAllowed: timeAllowed || undefined,
  }
}
