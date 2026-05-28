'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EMPTY_CREATE_QUESTION_ROWS, useAssignmentStore } from '@/store/assignmentStore'
import { validateAssignmentForm } from '@/validation/assignmentSchema'
import {
  createAssignment,
  ensureReferenceContent,
  fetchAssignmentStatus,
} from '@/lib/api/assignments'
import { normalizeQuestionPaper } from '@/lib/normalizeQuestionPaper'
import { saveQuestionPaperToCache } from '@/lib/questionPaperStorage'
import {
  addAssignmentToList,
  buildAssignmentListItem,
} from '@/lib/assignmentListStorage'
import { websocketManager } from '@/lib/websocket'
import { FileUpload } from './FileUpload'
import { QuestionTypes } from './QuestionTypes'
import { AdditionalInformation } from './AdditionalInformation'
import { CreateAssignmentHeader } from '@/components/create-assignment/CreateAssignmentHeader'
import { FormStepNav } from '@/components/create-assignment/FormStepNav'
import { GenerationOverlay } from '@/components/create-assignment/GenerationOverlay'
import { CalendarIcon } from '@/components/icons/FormIcons'

type GenerationPhase = 'idle' | 'creating' | 'generating' | 'failed'

export function AssignmentForm() {
  const router = useRouter()
  const formData = useAssignmentStore((state) => state.formData)
  const errors = useAssignmentStore((state) => state.errors)
  const isSubmitting = useAssignmentStore((state) => state.isSubmitting)
  const lastMessage = useAssignmentStore((state) => state.lastMessage)

  const setDueDate = useAssignmentStore((state) => state.setDueDate)
  const setErrors = useAssignmentStore((state) => state.setErrors)
  const clearError = useAssignmentStore((state) => state.clearError)
  const setIsSubmitting = useAssignmentStore((state) => state.setIsSubmitting)
  const resetForm = useAssignmentStore((state) => state.resetForm)

  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const pendingAssignmentIdRef = useRef<string | null>(null)
  useEffect(() => {
    const rows = useAssignmentStore.getState().formData.questionRows
    const currentTotal = rows.reduce((sum, row) => sum + row.count, 0)
    const needsLegacyCountsFix = currentTotal === 17 && rows.length === 4

    if (needsLegacyCountsFix) {
      useAssignmentStore.setState((state) => ({
        formData: {
          ...state.formData,
          questionRows: EMPTY_CREATE_QUESTION_ROWS.map((row) => ({ ...row })),
        },
      }))
    }
  }, [])

  useEffect(() => {
    const assignmentId = pendingAssignmentIdRef.current
    if (!assignmentId || !lastMessage) return

    const payload = lastMessage.payload as
      | { assignmentId?: string; status?: string; error?: string; questionPaper?: unknown }
      | undefined

    if (payload?.assignmentId && payload.assignmentId !== assignmentId) return

    if (lastMessage.type === 'assignment:status' && payload?.status === 'generating') {
      setGenerationPhase('generating')
      return
    }

    if (lastMessage.type === 'assignment:completed') {
      pendingAssignmentIdRef.current = null
      setGenerationPhase('idle')
      setIsSubmitting(false)
      const cached = normalizeQuestionPaper(payload?.questionPaper)
      if (cached) saveQuestionPaperToCache(assignmentId, cached)
      resetForm()
      router.push(`/assignments/${assignmentId}`)
      return
    }

    if (lastMessage.type === 'assignment:failed') {
      pendingAssignmentIdRef.current = null
      setGenerationPhase('failed')
      setGenerationError(payload?.error ?? 'Question generation failed')
      setIsSubmitting(false)
    }
  }, [lastMessage, resetForm, router, setIsSubmitting])

  useEffect(() => {
    if (generationPhase !== 'generating') return

    const assignmentId = pendingAssignmentIdRef.current
    if (!assignmentId) return

    const pollStatus = async () => {
      try {
        const data = await fetchAssignmentStatus(assignmentId)
        if (!data) return

        if (data.status === 'completed') {
          pendingAssignmentIdRef.current = null
          setGenerationPhase('idle')
          setIsSubmitting(false)
          try {
            const { fetchQuestionPaper } = await import('@/lib/api/assignments')
            await fetchQuestionPaper(assignmentId)
          } catch {
            // Paper may still be caching; output screen will retry.
          }
          resetForm()
          router.push(`/assignments/${assignmentId}`)
          return
        }
        if (data.status === 'failed') {
          pendingAssignmentIdRef.current = null
          setGenerationPhase('failed')
          setGenerationError('Question generation failed')
          setIsSubmitting(false)
        }
      } catch {
        // Ignore transient polling errors
      }
    }

    void pollStatus()
    const intervalId = window.setInterval(() => void pollStatus(), 4000)
    return () => window.clearInterval(intervalId)
  }, [generationPhase, resetForm, router, setIsSubmitting])

  const handleNext = async () => {
    setIsSubmitting(true)
    setGenerationError(null)

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

    const store = useAssignmentStore.getState()
    if (store.referenceExtracting) {
      setGenerationError('Please wait — your reference file is still being read.')
      setIsSubmitting(false)
      return
    }

    setGenerationPhase('creating')

    try {
      let referenceContent = store.referenceContent
      if (formData.file) {
        referenceContent = await ensureReferenceContent(formData.file, referenceContent)
        useAssignmentStore.getState().setReferenceContent(referenceContent)

        if (!referenceContent) {
          throw new Error(
            'Could not read text from your uploaded file. Check the file preview message, or paste the sample questions in Additional Instructions.',
          )
        }
      }

      const { assignmentId } = await createAssignment(formData, referenceContent)
      const title =
        formData.file?.name.replace(/\.[^.]+$/i, '') ||
        (referenceContent ? 'Reference-based Assignment' : 'New Assignment')
      addAssignmentToList(
        buildAssignmentListItem(assignmentId, {
          title,
          dueDate: formData.dueDate,
        }),
      )
      pendingAssignmentIdRef.current = assignmentId
      setGenerationPhase('generating')

      websocketManager.send({
        type: 'assignment:subscribe',
        payload: { assignmentId },
      })
    } catch (error) {
      pendingAssignmentIdRef.current = null
      setGenerationPhase('failed')
      setGenerationError(
        error instanceof Error ? error.message : 'Failed to create assignment',
      )
      setIsSubmitting(false)
    }
  }

  const isBusy = generationPhase === 'creating' || generationPhase === 'generating'
  const nextLabel =
    generationPhase === 'creating'
      ? 'Creating...'
      : generationPhase === 'generating'
        ? 'Generating...'
        : 'Next'

  return (
    <div className="create-assignment-page">
      {(isBusy || generationPhase === 'failed') && (
        <GenerationOverlay
          status={generationPhase === 'creating' ? 'creating' : 'generating'}
          error={generationPhase === 'failed' ? generationError : null}
          onDismissError={() => {
            setGenerationPhase('idle')
            setGenerationError(null)
          }}
        />
      )}
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

      <FormStepNav
        onNext={() => void handleNext()}
        nextDisabled={isSubmitting || isBusy}
        nextLabel={nextLabel}
      />
    </div>
  )
}
