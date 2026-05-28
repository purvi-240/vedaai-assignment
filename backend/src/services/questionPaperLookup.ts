import mongoose from 'mongoose'
import { Assignment } from '../models/Assignment.js'
import { QuestionPaper, type IQuestionPaper } from '../models/QuestionPaper.js'

export function isValidAssignmentId(id: string): boolean {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  )
}

type QuestionPaperLean = Pick<
  IQuestionPaper,
  | 'title'
  | 'sections'
  | 'totalMarks'
  | 'schoolName'
  | 'subject'
  | 'classLabel'
  | 'timeAllowed'
>

function toPaperPayload(paper: QuestionPaperLean) {
  return {
    title: paper.title,
    sections: paper.sections,
    totalMarks: paper.totalMarks,
    schoolName: paper.schoolName,
    subject: paper.subject,
    classLabel: paper.classLabel,
    timeAllowed: paper.timeAllowed,
  }
}

/** Resolve question paper by assignment id (direct lookup, then populated assignment). */
export async function getQuestionPaperByAssignmentId(
  assignmentId: string,
): Promise<ReturnType<typeof toPaperPayload> | null> {
  if (!isValidAssignmentId(assignmentId)) return null

  const oid = new mongoose.Types.ObjectId(assignmentId)

  const direct = await QuestionPaper.findOne({ assignmentId: oid }).lean()
  if (direct) return toPaperPayload(direct)

  const assignment = await Assignment.findById(oid)
    .populate<{ questionPaper: IQuestionPaper | null }>('questionPaper')
    .lean()

  if (assignment?.questionPaper && typeof assignment.questionPaper === 'object') {
    return toPaperPayload(assignment.questionPaper)
  }

  return null
}
