'use client'

import { useMemo } from 'react'
import {
  ALL_QUESTION_TYPES,
  computeQuestionTotals,
  useAssignmentStore,
} from '@/store/assignmentStore'

export function QuestionTypesFooter() {
  const questionRows = useAssignmentStore((state) => state.formData.questionRows)
  const addQuestionRow = useAssignmentStore((state) => state.addQuestionRow)

  const totals = useMemo(() => computeQuestionTotals(questionRows), [questionRows])
  const usedTypes = new Set(questionRows.map((row) => row.type))
  const canAddRow =
    questionRows.length < ALL_QUESTION_TYPES.length &&
    usedTypes.size < ALL_QUESTION_TYPES.length

  return (
    <div className="question-types-footer">
      <button
        type="button"
        className="btn-add-question-type"
        onClick={addQuestionRow}
        disabled={!canAddRow}
      >
        <span className="btn-add-question-type-icon" aria-hidden>
          +
        </span>
        <span className="btn-add-question-type-label">Add Question Type</span>
      </button>
      <div className="question-types-totals">
        <p>
          <span className="totals-label">Total Questions :</span>{' '}
          <span className="totals-value">{totals.totalQuestions}</span>
        </p>
        <p>
          <span className="totals-label">Total Marks :</span>{' '}
          <span className="totals-value">{totals.totalMarks}</span>
        </p>
      </div>
    </div>
  )
}
