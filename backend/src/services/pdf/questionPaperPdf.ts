import PDFDocument from 'pdfkit'
import type {
  Difficulty,
  GeneratedQuestion,
  GeneratedQuestionPaper,
  QuestionSection,
} from '../../types/assignment.js'
import { computeTotalMarksFromSections } from '../reference/computePaperTotals.js'
import { formatMcqOptionLabel } from '../reference/questionPaperFinalize.js'

const DEFAULT_SCHOOL = 'Delhi Public School, Sector-4, Bokaro'
const DEFAULT_TIME = '45 minutes'

const difficultyLabel: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Challenging',
}

export type QuestionPaperPdfInput = GeneratedQuestionPaper & {
  schoolName?: string
  subject?: string
  classLabel?: string
  timeAllowed?: string
}

function getSectionInstruction(questions: GeneratedQuestion[]): string {
  if (questions.length === 0) return 'Attempt all questions in this section.'

  const marks = questions[0].marks
  const sameMarks = questions.every((q) => q.marks === marks)

  if (sameMarks) {
    return `Attempt all questions. Each question carries ${marks} mark${marks === 1 ? '' : 's'}`
  }

  return 'Attempt all questions in this section.'
}

function pageLayout(doc: PDFKit.PDFDocument): { left: number; contentWidth: number; bottom: number } {
  const left = doc.page.margins.left
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const bottom = doc.page.height - doc.page.margins.bottom
  return { left, contentWidth, bottom }
}

function resetCursor(doc: PDFKit.PDFDocument, left: number): void {
  doc.x = left
}

function writeParagraph(
  doc: PDFKit.PDFDocument,
  text: string,
  left: number,
  contentWidth: number,
  options?: PDFKit.Mixins.TextOptions,
): void {
  resetCursor(doc, left)
  doc.text(text, left, doc.y, { width: contentWidth, lineGap: 2, ...options })
}

function ensureSpace(doc: PDFKit.PDFDocument, minHeight: number): void {
  const { bottom } = pageLayout(doc)
  if (doc.y + minHeight > bottom) {
    doc.addPage()
    resetCursor(doc, doc.page.margins.left)
  }
}

function drawStudentFields(
  doc: PDFKit.PDFDocument,
  left: number,
  contentWidth: number,
  classLabel: string,
): void {
  const rowGap = 26
  let y = doc.y

  doc.font('Helvetica').fontSize(11)

  doc.text('Name _____________________________', left, y, {
    width: contentWidth * 0.48,
    lineBreak: false,
  })
  doc.text('Roll Number ______________________', left + contentWidth * 0.52, y, {
    width: contentWidth * 0.48,
    lineBreak: false,
  })

  y += rowGap
  doc.text(`Class ${classLabel} _______________`, left, y, {
    width: contentWidth * 0.48,
    lineBreak: false,
  })
  doc.text('Section _______________', left + contentWidth * 0.52, y, {
    width: contentWidth * 0.48,
    lineBreak: false,
  })

  doc.y = y + rowGap
  resetCursor(doc, left)
}

function drawSection(
  doc: PDFKit.PDFDocument,
  section: QuestionSection,
  left: number,
  contentWidth: number,
): void {
  ensureSpace(doc, 100)
  resetCursor(doc, left)

  doc.font('Helvetica-Bold').fontSize(12)
  writeParagraph(doc, `Section ${section.label}`, left, contentWidth)

  doc.font('Helvetica-Bold').fontSize(11)
  writeParagraph(doc, section.title, left, contentWidth)

  doc.font('Helvetica').fontSize(10)
  writeParagraph(doc, getSectionInstruction(section.questions), left, contentWidth)

  doc.moveDown(0.5)
  resetCursor(doc, left)

  section.questions.forEach((question, index) => {
    ensureSpace(doc, 56)
    resetCursor(doc, left)

    const marksLabel = `${question.marks} Mark${question.marks === 1 ? '' : 's'}`
    const questionLine = `${index + 1}. [${difficultyLabel[question.difficulty]}] ${question.question} [${marksLabel}]`

    doc.font('Helvetica').fontSize(10)
    writeParagraph(doc, questionLine, left, contentWidth)

    if (question.options?.length) {
      question.options.forEach((option, optionIndex) => {
        const labeled = formatMcqOptionLabel(option, optionIndex)
        writeParagraph(doc, `   ${labeled}`, left, contentWidth - 12)
      })
    }

    doc.moveDown(0.4)
    resetCursor(doc, left)
  })

  doc.moveDown(0.3)
  resetCursor(doc, left)
}

function sanitizeAnswerText(answer: string): string {
  return answer.replace(/\s+/g, ' ').trim()
}

function drawAnswerKey(
  doc: PDFKit.PDFDocument,
  sections: QuestionSection[],
  left: number,
  contentWidth: number,
): void {
  let questionNumber = 0
  const answers: { number: number; answer: string }[] = []

  for (const section of sections) {
    for (const question of section.questions) {
      questionNumber += 1
      const raw = question.correctAnswer?.trim()
      if (raw) {
        answers.push({ number: questionNumber, answer: sanitizeAnswerText(raw) })
      }
    }
  }

  if (answers.length === 0) return

  ensureSpace(doc, 80)
  resetCursor(doc, left)
  doc.moveDown(0.6)

  doc.font('Helvetica-Bold').fontSize(12)
  writeParagraph(doc, 'Answer Key:', left, contentWidth)
  doc.moveDown(0.3)
  resetCursor(doc, left)

  answers.forEach((item) => {
    ensureSpace(doc, 24)
    resetCursor(doc, left)
    doc.font('Helvetica').fontSize(10)
    writeParagraph(doc, `${item.number}. ${item.answer}`, left, contentWidth)
    doc.moveDown(0.15)
  })
}

export function generateQuestionPaperPdf(paper: QuestionPaperPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const schoolName = paper.schoolName?.trim() || DEFAULT_SCHOOL
    const subject = paper.subject?.trim() || 'Science'
    const classLabel = paper.classLabel?.trim() || '8th'
    const timeAllowed = paper.timeAllowed?.replace(/\s*Maximum\s*Marks.*$/i, '').trim() || DEFAULT_TIME

    let { left, contentWidth } = pageLayout(doc)
    resetCursor(doc, left)

    doc.font('Helvetica-Bold').fontSize(16)
    writeParagraph(doc, schoolName, left, contentWidth, { align: 'center' })

    doc.font('Helvetica').fontSize(12)
    writeParagraph(doc, `Subject: ${subject}`, left, contentWidth, { align: 'center' })
    writeParagraph(doc, `Class: ${classLabel}`, left, contentWidth, { align: 'center' })

    doc.moveDown(0.6)
    resetCursor(doc, left)

    const metaY = doc.y
    const totalMarks = computeTotalMarksFromSections(paper.sections)
    doc.fontSize(11)

    doc.text(`Time Allowed: ${timeAllowed}`, left, metaY, {
      width: contentWidth / 2,
      align: 'left',
      lineBreak: false,
    })
    doc.text(`Maximum Marks: ${totalMarks}`, left, metaY, {
      width: contentWidth,
      align: 'right',
      lineBreak: false,
    })

    const metaLineHeight = doc.currentLineHeight(true)
    doc.y = metaY + metaLineHeight + 14
    resetCursor(doc, left)

    drawStudentFields(doc, left, contentWidth, classLabel)
    doc.moveDown(0.4)
    resetCursor(doc, left)

    for (const section of paper.sections) {
      drawSection(doc, section, left, contentWidth)
    }

    ensureSpace(doc, 40)
    resetCursor(doc, left)
    doc.font('Helvetica-Bold').fontSize(11)
    writeParagraph(doc, 'End of Question Paper', left, contentWidth, { align: 'center' })

    drawAnswerKey(doc, paper.sections, left, contentWidth)

    doc.end()
  })
}
