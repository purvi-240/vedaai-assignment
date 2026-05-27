import { z } from 'zod'
import { rowsToQuestionTypes } from '@/store/assignmentStore'
import type { AssignmentFormData } from '@/types/assignment'

export const questionTypeConfigSchema = z.object({
  type: z.enum([
    'mcq',
    'true_false',
    'short_answer',
    'long_answer',
    'fill_in_blank',
    'diagram',
    'numerical',
  ]),
  count: z
    .number({ error: 'Number of questions is required' })
    .int('Must be a whole number')
    .positive('Must be greater than 0'),
  marks: z
    .number({ error: 'Marks are required' })
    .positive('Marks must be greater than 0'),
})

const allowedFileTypes = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
]

export const assignmentSchema = z.object({
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((value) => /^\d{2}-\d{2}-\d{4}$/.test(value), 'Use DD-MM-YYYY format')
    .refine((value) => {
      const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
      if (!match) return false
      const [, dd, mm, yyyy] = match
      const selected = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !Number.isNaN(selected.getTime()) && selected >= today
    }, 'Due date cannot be in the past'),
  questionRows: z
    .array(
      z.object({
        id: z.string(),
        type: questionTypeConfigSchema.shape.type,
        count: questionTypeConfigSchema.shape.count,
        marks: questionTypeConfigSchema.shape.marks,
      }),
    )
    .min(1, 'Add at least one question type'),
  additionalInstructions: z.string(),
  file: z
    .instanceof(File)
    .nullable()
    .refine(
      (file) =>
        file === null ||
        allowedFileTypes.includes(file.type) ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.jpg') ||
        file.name.endsWith('.jpeg') ||
        file.name.endsWith('.png'),
      'Only PDF, text, JPEG, or PNG files are allowed',
    ),
})

export function validateAssignmentForm(formData: AssignmentFormData) {
  return assignmentSchema.safeParse(formData)
}

export function formDataToApiPayload(formData: AssignmentFormData) {
  return {
    dueDate: formData.dueDate,
    questionTypes: rowsToQuestionTypes(formData.questionRows),
    additionalInstructions: formData.additionalInstructions,
    hasFile: formData.file !== null,
    fileName: formData.file?.name ?? null,
  }
}
