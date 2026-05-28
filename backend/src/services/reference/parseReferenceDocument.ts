import type {
  Difficulty,
  GeneratedQuestion,
  GeneratedQuestionPaper,
  QuestionSection,
  QuestionType,
} from '../../types/assignment.js'
import { finalizeQuestionSections } from './questionPaperFinalize.js'

export interface ParsedReferenceMeta {
  schoolName: string
  subject: string
  classLabel: string
  timeAllowed: string
}

export interface ParsedReferenceQuestion {
  question: string
  difficulty: Difficulty
  marks: number
  type: QuestionType
  options?: string[]
  correctAnswer?: string
}

export interface ParsedReferenceSection {
  label: string
  title: string
  instruction?: string
  questions: ParsedReferenceQuestion[]
}

export interface ParsedReferenceDocument {
  meta: ParsedReferenceMeta
  sections: ParsedReferenceSection[]
  totalMarks: number
}

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  easy: 'easy',
  moderate: 'medium',
  medium: 'medium',
  challenging: 'hard',
  hard: 'hard',
}

function mapDifficulty(raw: string): Difficulty {
  return DIFFICULTY_MAP[raw.toLowerCase()] ?? 'medium'
}

function extractMeta(text: string): ParsedReferenceMeta {
  const schoolMatch = text.match(/Delhi Public School[^\n]*/i)
  const subjectMatch = text.match(/Subject:\s*([^\n]+)/i)
  const classMatch = text.match(/Class:\s*([^\n]+)/i)
  const timeMatch = text.match(/Time\s*Allowed:\s*([^|\n]+)/i)
  let timeAllowed = timeMatch?.[1]?.trim() ?? '45 minutes'
  timeAllowed = timeAllowed.replace(/\s*Maximum\s*Marks.*$/i, '').trim()
  if (!timeAllowed) timeAllowed = '45 minutes'

  let classLabel = classMatch?.[1]?.trim() ?? '8th'
  classLabel = classLabel.replace(/\s*Section.*$/i, '').trim()

  return {
    schoolName: schoolMatch?.[0]?.trim() ?? 'Delhi Public School, Sector-4, Bokaro',
    subject: subjectMatch?.[1]?.trim() ?? 'Science',
    classLabel,
    timeAllowed,
  }
}

function isMetaOrHeaderLine(line: string): boolean {
  const t = line.trim()
  if (!t) return true
  if (/^Delhi Public School/i.test(t)) return true
  if (/^Subject:\s*/i.test(t)) return true
  if (/^Class:\s*/i.test(t)) return true
  if (/^Time\s*Allowed:/i.test(t)) return true
  if (/^Maximum\s*Marks:/i.test(t)) return true
  if (/^All questions are compulsory/i.test(t)) return true
  if (/^End of Question Paper/i.test(t)) return true
  if (/^Name:\s*$/i.test(t)) return true
  if (/^Roll\s*Number:/i.test(t)) return true
  if (/^Section:\s*$/i.test(t)) return true
  if (/^Name\b/i.test(t) && t.length < 40) return true
  if (/^Roll\b/i.test(t) && t.length < 40) return true
  if (/_{3,}/.test(t) && t.length < 60) return true
  return false
}

function isOptionLine(line: string): boolean {
  const t = line.trim()
  return (
    /^\(?[a-dA-D]\)?[\.\):\-]\s+\S/.test(t) ||
    /^Option\s+[A-Da-d][\.\):\-]\s+/i.test(t) ||
    /^\([ivxlc]+\)\s+/i.test(t) ||
    /^[A-D][\.\)]\s+\S/.test(t)
  )
}

function formatOptionLabel(index: number, text: string): string {
  const label = String.fromCharCode(97 + index)
  const clean = text.trim()
  if (new RegExp(`^${label}\\)`, 'i').test(clean)) return clean
  return `${label}) ${clean}`
}

function parseOptionLine(line: string, optionIndex: number): string {
  const t = line.trim()
  const patterns = [
    /^\(?[a-dA-D]\)?[\.\):\-]\s+(.+)$/i,
    /^Option\s+[A-Da-d][\.\):\-]\s+(.+)$/i,
    /^\([ivxlc]+\)\s+(.+)$/i,
    /^[A-D][\.\)]\s+(.+)$/,
  ]
  for (const pattern of patterns) {
    const match = t.match(pattern)
    if (match?.[1]) return formatOptionLabel(optionIndex, match[1])
  }
  return formatOptionLabel(optionIndex, t)
}

/** e.g. "Bulb b) Motor c) Battery d) Wire" on one line */
function parseInlineMcqOptions(line: string): string[] | null {
  const t = line.trim()

  const fourPart = t.match(/^(.+?)\s+b\)\s+(.+?)\s+c\)\s+(.+?)\s+d\)\s+(.+)$/i)
  if (fourPart) {
    return [
      formatOptionLabel(0, fourPart[1]),
      formatOptionLabel(1, fourPart[2]),
      formatOptionLabel(2, fourPart[3]),
      formatOptionLabel(3, fourPart[4]),
    ]
  }

  const withA = t.match(
    /^a\)\s+(.+?)\s+b\)\s+(.+?)\s+c\)\s+(.+?)\s+d\)\s+(.+)$/i,
  )
  if (withA) {
    return [
      formatOptionLabel(0, withA[1]),
      formatOptionLabel(1, withA[2]),
      formatOptionLabel(2, withA[3]),
      formatOptionLabel(3, withA[4]),
    ]
  }

  return null
}

function isInlineMcqOptions(line: string): boolean {
  return /\sb\)\s+/i.test(line) && /\sc\)\s+/i.test(line) && /\sd\)\s+/i.test(line)
}

function isGarbageAnswerLine(line: string): boolean {
  const t = line.trim()
  if (!t) return true
  if (t === '--' || t === '—' || t === '-') return true
  if (/^\d+\s+of\s+\d+$/i.test(t)) return true
  if (/^Page\s+\d+/i.test(t)) return true
  return false
}

function parseNumberedAnswerKey(keyBlock: string): Map<number, string> {
  const answers = new Map<number, string>()
  const lines = keyBlock.split('\n')

  let currentNumber: number | null = null
  let buffer: string[] = []

  const flush = () => {
    if (currentNumber !== null && buffer.length > 0) {
      const text = buffer.join(' ').replace(/\s+/g, ' ').trim()
      if (!isGarbageAnswerLine(text)) answers.set(currentNumber, text)
    }
    buffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || /^End of/i.test(trimmed) || isGarbageAnswerLine(trimmed)) continue

    const numbered = trimmed.match(/^(\d+)\.\s*(.*)$/)
    if (numbered) {
      flush()
      currentNumber = Number(numbered[1])
      if (numbered[2] && !isGarbageAnswerLine(numbered[2])) buffer.push(numbered[2])
    } else if (currentNumber !== null && !isGarbageAnswerLine(trimmed)) {
      buffer.push(trimmed)
    }
  }
  flush()

  return answers
}

function parseSequentialAnswerKey(keyBlock: string): string[] {
  const items: string[] = []
  for (const line of keyBlock.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || /^End of/i.test(trimmed) || isGarbageAnswerLine(trimmed)) continue
    if (/^Answer\s*Key/i.test(trimmed)) continue
    if (/^\d+\.\s/.test(trimmed)) continue
    if (trimmed.length < 2) continue
    items.push(trimmed.replace(/\s+/g, ' '))
  }
  return items
}

function parseAnswerKey(text: string, totalQuestions: number): Map<number, string> {
  const answers = new Map<number, string>()
  const keyMatch = text.match(/Answer\s*Key\s*:?\s*/i)
  if (!keyMatch || keyMatch.index === undefined) return answers

  const keyBlock = text.slice(keyMatch.index + keyMatch[0].length)
  const numbered = parseNumberedAnswerKey(keyBlock)

  for (const [num, ans] of numbered) {
    answers.set(num, ans)
  }

  if (answers.size < totalQuestions * 0.4) {
    const sequential = parseSequentialAnswerKey(keyBlock)
    for (let i = 0; i < sequential.length && i < totalQuestions; i += 1) {
      const num = i + 1
      if (!answers.has(num)) {
        answers.set(num, sequential[i])
      }
    }
  }

  return answers
}

interface ParsedQuestionLine {
  question: string
  difficulty: Difficulty
  marks: number
}

function parseQuestionStart(line: string): ParsedQuestionLine | null {
  const withDifficulty = line.match(
    /^\s*(\d+)\.\s*\[(Easy|Moderate|Challenging|Medium|Hard)\]\s*(.+?)(?:\s*\[(\d+)\s*Marks?\])?\s*$/i,
  )
  if (withDifficulty) {
    const body = withDifficulty[3].replace(/\s*\[\d+\s*Marks?\]\s*$/i, '').trim()
    if (isMetaOrHeaderLine(body) || body.length < 10) return null
    const marks = withDifficulty[4] ? Number(withDifficulty[4]) : 2
    return {
      difficulty: mapDifficulty(withDifficulty[2]),
      question: body,
      marks: Number.isFinite(marks) && marks > 0 ? marks : 2,
    }
  }

  const plain = line.match(/^\s*(\d+)\.\s+(.+?)(?:\s*\[(\d+)\s*Marks?\])?\s*$/i)
  if (!plain) return null

  let body = plain[2].trim()
  body = body.replace(/\s*\[\d+\s*Marks?\]\s*$/i, '').trim()

  if (isMetaOrHeaderLine(body) || body.length < 10) return null
  if (/^(Name|Roll|Class|Section|Subject|Time|Maximum)/i.test(body)) return null

  const marks = plain[3] ? Number(plain[3]) : 2
  return {
    difficulty: 'medium',
    question: body,
    marks: Number.isFinite(marks) && marks > 0 ? marks : 2,
  }
}

function isQuestionStart(line: string): boolean {
  return parseQuestionStart(line) !== null
}

function parseQuestionsFromLines(
  lines: string[],
  answerKey: Map<number, string>,
  questionOffset: number,
): ParsedReferenceQuestion[] {
  const questions: ParsedReferenceQuestion[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    i += 1
    if (!line || isMetaOrHeaderLine(line)) continue
    if (/^Attempt all/i.test(line)) continue

    const start = parseQuestionStart(line)
    if (!start) continue

    const options: string[] = []
    while (i < lines.length) {
      const next = lines[i].trim()
      if (!next) {
        i += 1
        continue
      }
      if (isQuestionStart(next)) break
      if (isMetaOrHeaderLine(next)) {
        i += 1
        continue
      }

      const inlineOptions = parseInlineMcqOptions(next)
      if (inlineOptions) {
        options.push(...inlineOptions)
        i += 1
        continue
      }

      if (isInlineMcqOptions(next)) {
        const split = parseInlineMcqOptions(next)
        if (split) {
          options.push(...split)
          i += 1
          continue
        }
      }

      if (isOptionLine(next)) {
        options.push(parseOptionLine(next, options.length))
        i += 1
        continue
      }
      break
    }

    const globalNum = questionOffset + questions.length + 1
    const type: QuestionType = options.length >= 2 ? 'mcq' : 'short_answer'

    questions.push({
      question: start.question,
      difficulty: start.difficulty,
      marks: start.marks,
      type,
      options: options.length > 0 ? options : undefined,
      correctAnswer: answerKey.get(globalNum),
    })
  }

  return questions
}

function stripHeaderBeforeQuestions(text: string): string {
  const sectionIdx = text.search(/Section\s+[A-Z]\b/i)
  if (sectionIdx > 0) return text.slice(sectionIdx)

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (isQuestionStart(lines[i].trim())) {
      return lines.slice(i).join('\n')
    }
  }

  return text
}

function inferSectionTitle(lines: string[]): string {
  for (const line of lines) {
    const t = line.trim()
    if (/^Attempt all/i.test(t)) continue
    if (isQuestionStart(t)) break
    if (
      t.length > 3 &&
      t.length < 80 &&
      !isMetaOrHeaderLine(t) &&
      !/^Section\s+[A-Z]/i.test(t)
    ) {
      return t
    }
  }
  return 'Questions'
}

export function parseReferenceDocument(reference: string): ParsedReferenceDocument | null {
  const text = reference.replace(/\r\n/g, '\n').trim()
  if (text.length < 80) return null

  const meta = extractMeta(text)

  const bodyEnd = text.search(/Answer\s*Key\s*:?/i)
  let bodyText = bodyEnd > 0 ? text.slice(0, bodyEnd) : text
  bodyText = stripHeaderBeforeQuestions(bodyText)

  const sections: ParsedReferenceSection[] = []
  const sectionParts = bodyText.split(/(?=Section\s+[A-Z]\b)/gi)

  for (const part of sectionParts) {
    const header = part.match(/Section\s+([A-Z])\s*\n?/i)
    if (!header) continue

    const label = header[1].toUpperCase()
    const afterHeader = part.slice(header.index! + header[0].length)
    const rawLines = afterHeader.split('\n')
    const lines = rawLines.map((l) => l.trim())

    const title = inferSectionTitle(lines)
    const instruction = lines.find((l) => /^Attempt all/i.test(l))
    const questionOffset = sections.reduce((sum, sec) => sum + sec.questions.length, 0)
    const questions = parseQuestionsFromLines(lines, new Map(), questionOffset)

    if (questions.length > 0) {
      sections.push({
        label,
        title,
        instruction,
        questions,
      })
    }
  }

  if (sections.length === 0) {
    const lines = bodyText.split('\n').map((l) => l.trim())
    const questions = parseQuestionsFromLines(lines, new Map(), 0)

    if (questions.length > 0) {
      sections.push({
        label: 'A',
        title: inferSectionTitle(lines) || 'Short Answer Questions',
        instruction: lines.find((l) => /^Attempt all/i.test(l)),
        questions,
      })
    }
  }

  if (sections.length === 0) return null

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const answerKey = parseAnswerKey(text, totalQuestions)

  let globalNum = 0
  for (const section of sections) {
    for (const question of section.questions) {
      globalNum += 1
      const fromKey = answerKey.get(globalNum)
      if (fromKey) question.correctAnswer = fromKey
    }
  }

  const totalMarks = sections.reduce(
    (sum, section) => sum + section.questions.reduce((s, q) => s + q.marks, 0),
    0,
  )

  return { meta, sections, totalMarks }
}

export function paperFromParsedReference(
  parsed: ParsedReferenceDocument,
): GeneratedQuestionPaper & { meta: ParsedReferenceMeta } {
  const sections: QuestionSection[] = parsed.sections.map((section) => ({
    label: section.label,
    title: section.title,
    questions: section.questions.map((q, index) => {
      const question: GeneratedQuestion = {
        id: `${section.label}${index + 1}`,
        type: q.type,
        question: q.question,
        difficulty: q.difficulty,
        marks: q.marks,
        correctAnswer: q.correctAnswer,
      }
      if (q.options && q.options.length > 0) {
        question.options = q.options
      }
      return question
    }),
  }))

  finalizeQuestionSections(sections)

  return {
    title: `${parsed.meta.subject} — Class ${parsed.meta.classLabel}`,
    sections,
    totalMarks: parsed.totalMarks,
    meta: parsed.meta,
  }
}
