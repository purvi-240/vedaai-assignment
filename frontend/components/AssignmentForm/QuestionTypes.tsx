'use client'

import {
  CREATE_ASSIGNMENT_QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  useAssignmentStore,
} from '@/store/assignmentStore'

const MIN_ROWS = CREATE_ASSIGNMENT_QUESTION_TYPES.length
import { QuestionTypesFooter } from './QuestionTypesFooter'
import type { QuestionType } from '@/types/assignment'
import { CloseIcon } from '@/components/icons/FormIcons'
import { NumberStepper } from '@/components/create-assignment/NumberStepper'

export function QuestionTypes() {
  const questionRows = useAssignmentStore((state) => state.formData.questionRows)
  const errors = useAssignmentStore((state) => state.errors)
  const removeQuestionRow = useAssignmentStore((state) => state.removeQuestionRow)
  const updateQuestionRowType = useAssignmentStore((state) => state.updateQuestionRowType)
  const updateQuestionRowCount = useAssignmentStore((state) => state.updateQuestionRowCount)
  const updateQuestionRowMarks = useAssignmentStore((state) => state.updateQuestionRowMarks)
  const clearError = useAssignmentStore((state) => state.clearError)

  const listError = errors.questionRows

  const handleTypeChange = (id: string, type: QuestionType) => {
    updateQuestionRowType(id, type)
    clearError('questionRows')
  }

  return (
    <section className="form-section question-types-section">
      <div className="question-types-table-wrap desktop-only">
        <div className="question-types-table-header">
          <span>Question Type</span>
          <span className="question-types-remove-col" aria-hidden />
          <span>No. of Questions</span>
          <span>Marks</span>
        </div>

        {questionRows.map((row, index) => (
          <div key={row.id} className="question-types-table-row">
            <div className="question-type-select-wrap">
              <select
                className="question-type-select"
                value={row.type}
                onChange={(e) =>
                  handleTypeChange(row.id, e.target.value as QuestionType)
                }
                aria-label="Question type"
              >
                {CREATE_ASSIGNMENT_QUESTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {QUESTION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="question-row-remove"
              onClick={() => removeQuestionRow(row.id)}
              disabled={questionRows.length <= MIN_ROWS}
              aria-label="Remove question type"
            >
              <CloseIcon />
            </button>
            <NumberStepper
              value={row.count}
              onChange={(v) => {
                updateQuestionRowCount(row.id, v)
                clearError(`questionRows.${index}.count`)
              }}
              ariaLabel="number of questions"
            />
            <NumberStepper
              value={row.marks}
              onChange={(v) => {
                updateQuestionRowMarks(row.id, v)
                clearError(`questionRows.${index}.marks`)
              }}
              min={1}
              ariaLabel="marks per question"
            />
          </div>
        ))}
      </div>

      <div className="question-types-mobile mobile-only">
        {questionRows.map((row, index) => (
          <div key={row.id} className="question-type-mobile-card">
            <div className="question-type-mobile-top">
              <select
                className="question-type-select"
                value={row.type}
                onChange={(e) =>
                  handleTypeChange(row.id, e.target.value as QuestionType)
                }
                aria-label="Question type"
              >
                {CREATE_ASSIGNMENT_QUESTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {QUESTION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="question-row-remove"
                onClick={() => removeQuestionRow(row.id)}
                disabled={questionRows.length <= MIN_ROWS}
                aria-label="Remove question type"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="question-type-mobile-fields">
              <div className="question-type-mobile-field">
                <span className="question-type-mobile-label">No. of Questions</span>
                <NumberStepper
                  value={row.count}
                  onChange={(v) => {
                    updateQuestionRowCount(row.id, v)
                    clearError(`questionRows.${index}.count`)
                  }}
                  ariaLabel="number of questions"
                />
              </div>
              <div className="question-type-mobile-field">
                <span className="question-type-mobile-label">Marks</span>
                <NumberStepper
                  value={row.marks}
                  onChange={(v) => {
                    updateQuestionRowMarks(row.id, v)
                    clearError(`questionRows.${index}.marks`)
                  }}
                  min={1}
                  ariaLabel="marks per question"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <QuestionTypesFooter />

      {listError && <p className="field-error">{listError}</p>}
    </section>
  )
}
