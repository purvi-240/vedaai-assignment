import type { QuestionSection } from '../../types/assignment.js'

export function computeTotalMarksFromSections(sections: QuestionSection[]): number {
  return sections.reduce(
    (total, section) =>
      total + section.questions.reduce((sectionTotal, question) => sectionTotal + question.marks, 0),
    0,
  )
}
