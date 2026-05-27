export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short_answer'
  | 'long_answer'
  | 'fill_in_blank'
  | 'diagram'
  | 'numerical'

export interface QuestionTypeRow {
  id: string
  type: QuestionType
  count: number
  marks: number
}

export interface QuestionTypeConfig {
  type: QuestionType
  count: number
  marks: number
}

export interface AssignmentFormData {
  file: File | null
  dueDate: string
  questionRows: QuestionTypeRow[]
  additionalInstructions: string
}

/** @deprecated Use questionRows — kept for API payload mapping */
export interface QuestionTypeConfig {
  type: QuestionType
  count: number
  marks: number
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  type: string
  payload?: unknown
}

export interface AssignmentListItem {
  id: string
  title: string
  assignedOn: string
  dueDate: string
}
