'use client'

import { useEffect } from 'react'
import {
  DEFAULT_CREATE_QUESTION_ROWS,
  ensureCreateQuestionRows,
  useAssignmentStore,
} from '@/store/assignmentStore'
import {
  formDataToApiPayload,
  validateAssignmentForm,
} from '@/validation/assignmentSchema'
import { websocketManager } from '@/lib/websocket'
import { FileUpload } from './FileUpload'
import { QuestionTypes } from './QuestionTypes'
import { AdditionalInformation } from './AdditionalInformation'
import { CreateAssignmentHeader } from '@/components/create-assignment/CreateAssignmentHeader'
import { FormStepNav } from '@/components/create-assignment/FormStepNav'
import { CalendarIcon } from '@/components/icons/FormIcons'

export function AssignmentForm() {
  const formData = useAssignmentStore((state) => state.formData)
  const errors = useAssignmentStore((state) => state.errors)
  const isSubmitting = useAssignmentStore((state) => state.isSubmitting)

  const setDueDate = useAssignmentStore((state) => state.setDueDate)
  const setErrors = useAssignmentStore((state) => state.setErrors)
  const clearError = useAssignmentStore((state) => state.clearError)
  const setIsSubmitting = useAssignmentStore((state) => state.setIsSubmitting)
  useEffect(() => {
    const rows = useAssignmentStore.getState().formData.questionRows
    const fixed = ensureCreateQuestionRows(rows)
    const needsTypesFix =
      fixed.length !== rows.length ||
      fixed.some((row, index) => row.type !== rows[index]?.type)
    const currentTotal = fixed.reduce((sum, row) => sum + row.count, 0)
    const needsCountsFix = currentTotal === 17 && fixed.length === 4

    if (needsTypesFix || needsCountsFix) {
      useAssignmentStore.setState((state) => ({
        formData: {
          ...state.formData,
          questionRows: DEFAULT_CREATE_QUESTION_ROWS.map((row) => ({ ...row })),
        },
      }))
    }
  }, [])

  const handleNext = () => {
    setIsSubmitting(true)

    const result = validateAssignmentForm(formData)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    setErrors({})

    websocketManager.send({
      type: 'assignment:create',
      payload: formDataToApiPayload(formData),
    })

    setIsSubmitting(false)
  }

  return (
    <div className="create-assignment-page">
      <CreateAssignmentHeader />

      <div className="create-form-card">
        <div className="create-form-card-header">
          <h2 className="create-form-card-title">Assignment Details</h2>
          <p className="create-form-card-subtitle">
            Basic information about your assignment
          </p>
        </div>

        <div className="create-form-grid">
          <div className="create-form-grid-upload">
            <FileUpload />
          </div>

          <div className="create-form-grid-due form-field">
            <label htmlFor="dueDate" className="form-label-bold">
              Due Date
            </label>
            <div className={`due-date-wrap ${errors.dueDate ? 'has-error' : ''}`}>
              <input
                id="dueDate"
                type="text"
                className="due-date-input"
                placeholder="DD-MM-YYYY"
                value={formData.dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value)
                  clearError('dueDate')
                }}
              />
              <CalendarIcon className="due-date-icon" />
            </div>
            {errors.dueDate && (
              <p className="field-error">{errors.dueDate}</p>
            )}
          </div>

          <div className="create-form-grid-questions">
            <QuestionTypes />
          </div>

          <div className="create-form-grid-additional">
            <AdditionalInformation />
          </div>
        </div>
      </div>

      <FormStepNav onNext={handleNext} nextDisabled={isSubmitting} />
    </div>
  )
}
