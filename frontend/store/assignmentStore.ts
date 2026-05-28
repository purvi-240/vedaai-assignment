import { create } from 'zustand'
import type {
  AssignmentFormData,
  QuestionType,
  QuestionTypeRow,
  WebSocketMessage,
  WebSocketStatus,
} from '@/types/assignment'

interface AssignmentState {
  formData: AssignmentFormData
  errors: Record<string, string>
  isSubmitting: boolean
  wsStatus: WebSocketStatus
  lastMessage: WebSocketMessage | null
  referenceContent: string | null
  referenceExtracting: boolean
  referenceExtractError: string | null

  setFile: (file: File | null) => void
  setReferenceContent: (content: string | null) => void
  setReferenceExtracting: (extracting: boolean) => void
  setReferenceExtractError: (error: string | null) => void
  setDueDate: (dueDate: string) => void
  addQuestionRow: () => void
  removeQuestionRow: (id: string) => void
  updateQuestionRowType: (id: string, type: QuestionType) => void
  updateQuestionRowCount: (id: string, value: number) => void
  updateQuestionRowMarks: (id: string, value: number) => void
  setAdditionalInstructions: (instructions: string) => void
  setErrors: (errors: Record<string, string>) => void
  clearError: (field: string) => void
  setIsSubmitting: (isSubmitting: boolean) => void
  setWsStatus: (status: WebSocketStatus) => void
  setLastMessage: (message: WebSocketMessage | null) => void
  resetForm: () => void
}

function createRow(
  type: QuestionType,
  count: number,
  marks: number,
): QuestionTypeRow {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    count,
    marks,
  }
}

/** Figma Screen 3: exactly 4 question types */
export const CREATE_ASSIGNMENT_QUESTION_TYPES = [
  'mcq',
  'short_answer',
  'diagram',
  'numerical',
] as const satisfies readonly QuestionType[]

/** Pristine create form: all four types visible, counts and marks at zero. */
export const EMPTY_CREATE_QUESTION_ROWS: QuestionTypeRow[] = [
  { id: 'row-mcq', type: 'mcq', count: 0, marks: 0 },
  { id: 'row-short', type: 'short_answer', count: 0, marks: 0 },
  { id: 'row-diagram', type: 'diagram', count: 0, marks: 0 },
  { id: 'row-numerical', type: 'numerical', count: 0, marks: 0 },
]

/** @deprecated Legacy defaults kept for HMR migration only. */
export const DEFAULT_CREATE_QUESTION_ROWS: QuestionTypeRow[] = [
  { id: 'row-mcq', type: 'mcq', count: 4, marks: 1 },
  { id: 'row-short', type: 'short_answer', count: 3, marks: 2 },
  { id: 'row-diagram', type: 'diagram', count: 8, marks: 5 },
  { id: 'row-numerical', type: 'numerical', count: 10, marks: 1 },
]

/** Always show all 4 Figma question types (fixes clipped/HMR state). */
export function ensureCreateQuestionRows(rows: QuestionTypeRow[]): QuestionTypeRow[] {
  const byType = new Map(rows.map((row) => [row.type, row]))
  return CREATE_ASSIGNMENT_QUESTION_TYPES.map((type) => {
    const existing = byType.get(type)
    const fallback = EMPTY_CREATE_QUESTION_ROWS.find((row) => row.type === type)!
    return existing ? { ...existing, type } : { ...fallback }
  })
}

const initialFormData: AssignmentFormData = {
  file: null,
  dueDate: '',
  questionRows: EMPTY_CREATE_QUESTION_ROWS,
  additionalInstructions: '',
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  formData: initialFormData,
  errors: {},
  isSubmitting: false,
  wsStatus: 'disconnected',
  lastMessage: null,
  referenceContent: null,
  referenceExtracting: false,
  referenceExtractError: null,

  setFile: (file) =>
    set((state) => ({
      formData: { ...state.formData, file },
      referenceContent: null,
      referenceExtractError: null,
      referenceExtracting: false,
    })),

  setReferenceContent: (referenceContent) => set({ referenceContent }),
  setReferenceExtracting: (referenceExtracting) => set({ referenceExtracting }),
  setReferenceExtractError: (referenceExtractError) => set({ referenceExtractError }),

  setDueDate: (dueDate) =>
    set((state) => ({
      formData: { ...state.formData, dueDate },
    })),

  addQuestionRow: () =>
    set((state) => {
      const { questionRows } = state.formData
      if (questionRows.length >= ALL_QUESTION_TYPES.length) {
        return state
      }
      const used = new Set(questionRows.map((r) => r.type))
      const nextType = ALL_QUESTION_TYPES.find((t) => !used.has(t))
      if (!nextType) return state
      return {
        formData: {
          ...state.formData,
          questionRows: [...questionRows, createRow(nextType, 0, 0)],
        },
      }
    }),

  removeQuestionRow: (id) =>
    set((state) => {
      if (state.formData.questionRows.length <= MIN_QUESTION_TYPE_ROWS) {
        return state
      }
      return {
        formData: {
          ...state.formData,
          questionRows: state.formData.questionRows.filter((r) => r.id !== id),
        },
      }
    }),

  updateQuestionRowType: (id, type) =>
    set((state) => ({
      formData: {
        ...state.formData,
        questionRows: state.formData.questionRows.map((r) =>
          r.id === id ? { ...r, type } : r,
        ),
      },
    })),

  updateQuestionRowCount: (id, count) =>
    set((state) => ({
      formData: {
        ...state.formData,
        questionRows: state.formData.questionRows.map((r) =>
          r.id === id ? { ...r, count } : r,
        ),
      },
    })),

  updateQuestionRowMarks: (id, marks) =>
    set((state) => ({
      formData: {
        ...state.formData,
        questionRows: state.formData.questionRows.map((r) =>
          r.id === id ? { ...r, marks } : r,
        ),
      },
    })),

  setAdditionalInstructions: (additionalInstructions) =>
    set((state) => ({
      formData: { ...state.formData, additionalInstructions },
    })),

  setErrors: (errors) => set({ errors }),

  clearError: (field) =>
    set((state) => {
      const { [field]: _, ...rest } = state.errors
      return { errors: rest }
    }),

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  setWsStatus: (wsStatus) => set({ wsStatus }),

  setLastMessage: (lastMessage) => set({ lastMessage }),

  resetForm: () =>
    set({
      formData: {
        file: null,
        dueDate: '',
        questionRows: EMPTY_CREATE_QUESTION_ROWS.map((row) => ({ ...row })),
        additionalInstructions: '',
      },
      errors: {},
      isSubmitting: false,
      referenceContent: null,
      referenceExtracting: false,
      referenceExtractError: null,
    }),
}))

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice Questions',
  short_answer: 'Short Questions',
  diagram: 'Diagram/Graph-Based Questions',
  numerical: 'Numerical Problems',
  true_false: 'True / False',
  long_answer: 'Long Answer',
  fill_in_blank: 'Fill in the Blank',
}

export const ALL_QUESTION_TYPES: QuestionType[] = [
  'mcq',
  'short_answer',
  'diagram',
  'numerical',
  'true_false',
  'long_answer',
  'fill_in_blank',
]

export const MIN_QUESTION_TYPE_ROWS = 1

/** Question types available for a row (current type + types not used elsewhere). */
export function questionTypesForRow(
  rows: QuestionTypeRow[],
  rowId: string,
): QuestionType[] {
  const row = rows.find((r) => r.id === rowId)
  const usedElsewhere = new Set(
    rows.filter((r) => r.id !== rowId).map((r) => r.type),
  )
  return ALL_QUESTION_TYPES.filter((type) => type === row?.type || !usedElsewhere.has(type))
}

export function computeQuestionTotals(rows: QuestionTypeRow[]) {
  return rows.reduce(
    (acc, row) => ({
      totalQuestions: acc.totalQuestions + row.count,
      totalMarks: acc.totalMarks + row.count * row.marks,
    }),
    { totalQuestions: 0, totalMarks: 0 },
  )
}

export function rowsToQuestionTypes(rows: QuestionTypeRow[]) {
  return rows
    .filter(({ count, marks }) => count > 0 && marks > 0)
    .map(({ type, count, marks }) => ({ type, count, marks }))
}
