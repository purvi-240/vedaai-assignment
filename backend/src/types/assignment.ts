export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short_answer'
  | 'long_answer'
  | 'fill_in_blank'
  | 'diagram'
  | 'numerical'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuestionTypeConfig {
  type: QuestionType
  count: number
  marks: number
}

export type AssignmentStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface GeneratedQuestion {
  id: string
  type: QuestionType
  question: string
  difficulty: Difficulty
  marks: number
  options?: string[]
  correctAnswer?: string
}

export interface QuestionSection {
  label: string
  title: string
  questions: GeneratedQuestion[]
}

export interface GeneratedQuestionPaper {
  title: string
  sections: QuestionSection[]
  totalMarks: number
}

export interface WebSocketMessage {
  type: string
  payload?: unknown
}
