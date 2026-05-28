import type { AssignmentFormData, AssignmentListItem } from '@/types/assignment'
import { extractReferenceFromFile } from '@/lib/api/reference'
import {
  loadQuestionPaperFromCache,
  saveQuestionPaperToCache,
} from '@/lib/questionPaperStorage'
import {
  normalizeQuestionPaper,
  type QuestionPaper,
} from '@/lib/normalizeQuestionPaper'
import { formDataToApiPayload } from '@/validation/assignmentSchema'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export interface CreateAssignmentResponse {
  success: boolean
  data?: {
    _id: string
    status: string
  }
  error?: string
  errors?: unknown
}

function needsReferenceExtraction(file: File | null): boolean {
  if (!file) return false
  const name = file.name.toLowerCase()
  return (
    file.type === 'application/pdf' ||
    file.type === 'text/plain' ||
    file.type.startsWith('image/') ||
    name.endsWith('.pdf') ||
    name.endsWith('.txt') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png')
  )
}

export async function ensureReferenceContent(
  file: File | null,
  currentContent: string | null,
): Promise<string | null> {
  if (!file || !needsReferenceExtraction(file)) {
    return currentContent?.trim() ? currentContent.trim() : null
  }

  if (currentContent && currentContent.trim().length > 0) {
    return currentContent.trim()
  }

  const extracted = await extractReferenceFromFile(file)
  return extracted.trim().length > 0 ? extracted.trim() : null
}

export async function createAssignment(
  formData: AssignmentFormData,
  referenceContent?: string | null,
): Promise<{ assignmentId: string }> {
  const payload = formDataToApiPayload(formData)
  const trimmedReference = referenceContent?.trim() ? referenceContent.trim() : undefined

  const metadata = {
    dueDate: payload.dueDate,
    questionTypes: payload.questionTypes,
    additionalInstructions: payload.additionalInstructions,
    referenceFileName: payload.fileName ?? undefined,
    referenceContent: trimmedReference,
  }

  let response: Response

  if (formData.file) {
    const body = new FormData()
    body.append('metadata', JSON.stringify(metadata))
    body.append('referenceFile', formData.file)

    response = await fetch(`${API_BASE}/api/assignments`, {
      method: 'POST',
      body,
    })
  } else {
    response = await fetch(`${API_BASE}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    })
  }

  const result = (await response.json()) as CreateAssignmentResponse

  if (!response.ok || !result.success || !result.data?._id) {
    const message =
      result.error ??
      (typeof result.errors === 'object' ? 'Invalid assignment data' : 'Failed to create assignment')
    throw new Error(message)
  }

  return { assignmentId: result.data._id }
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i)
  return match?.[1]?.replace(/"/g, '') ?? null
}

async function downloadPdfBlob(response: Response, fallbackTitle?: string): Promise<void> {
  const blob = await response.blob()
  const filename =
    filenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
    `${fallbackTitle?.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'question-paper'}.pdf`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function downloadQuestionPaperPdf(
  assignmentId: string,
  fallbackTitle?: string,
  cachedPaper?: QuestionPaper | null,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/assignments/${assignmentId}/question-paper/pdf`,
    { cache: 'no-store' },
  )

  if (response.ok) {
    await downloadPdfBlob(response, fallbackTitle)
    return
  }

  const paper = cachedPaper ?? loadQuestionPaperFromCache(assignmentId)
  if (!paper) {
    let message = 'Failed to download PDF'
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  const renderResponse = await fetch(`${API_BASE}/api/assignments/question-paper/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paper),
  })

  if (!renderResponse.ok) {
    throw new Error('Failed to generate PDF from saved question paper')
  }

  await downloadPdfBlob(renderResponse, fallbackTitle ?? paper.title)
}

const PAPER_LOAD_RETRY_MS = 1500
const MAX_PAPER_LOAD_ATTEMPTS = 40

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface QuestionPaperApiResponse {
  success: boolean
  data?: unknown
  error?: string
  status?: string
}

export async function fetchQuestionPaper(assignmentId: string): Promise<QuestionPaper> {
  const cached = loadQuestionPaperFromCache(assignmentId)
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_PAPER_LOAD_ATTEMPTS; attempt += 1) {
    try {
      const status = await fetchAssignmentStatus(assignmentId)

      if (status?.status === 'failed') {
        throw new Error('Question generation failed for this assignment')
      }

      if (status?.status === 'pending' || status?.status === 'generating') {
        lastError = new Error('Question paper is still being generated…')
        if (attempt < MAX_PAPER_LOAD_ATTEMPTS - 1) {
          await wait(PAPER_LOAD_RETRY_MS)
          continue
        }
        throw lastError
      }
    } catch (statusError) {
      if (
        statusError instanceof Error &&
        statusError.message.includes('generation failed')
      ) {
        throw statusError
      }
      // Assignment may have been removed from DB; still try question-paper + cache.
    }

    const response = await fetch(
      `${API_BASE}/api/assignments/${assignmentId}/question-paper`,
      { cache: 'no-store' },
    )
    const payload = (await response.json()) as QuestionPaperApiResponse

    if (response.status === 202) {
      lastError = new Error(payload.error ?? 'Question paper is still being generated…')
      if (attempt < MAX_PAPER_LOAD_ATTEMPTS - 1) {
        await wait(PAPER_LOAD_RETRY_MS)
        continue
      }
      throw lastError
    }

    if (response.status === 422) {
      throw new Error(payload.error ?? 'Question generation failed')
    }

    if (response.ok && payload.success && payload.data) {
      const normalized = normalizeQuestionPaper(payload.data)
      if (normalized) {
        saveQuestionPaperToCache(assignmentId, normalized)
        return normalized
      }
      lastError = new Error('Question paper has no sections yet')
    } else {
      lastError = new Error(payload.error ?? 'Question paper not found')

      if (response.status === 404 && cached) {
        let useCache = false
        try {
          const latestStatus = await fetchAssignmentStatus(assignmentId)
          useCache =
            !latestStatus ||
            latestStatus.status === 'completed' ||
            latestStatus.status === 'failed'
        } catch {
          useCache = true
        }
        if (useCache) return cached
      }
    }

    if (attempt < MAX_PAPER_LOAD_ATTEMPTS - 1) {
      await wait(PAPER_LOAD_RETRY_MS)
    }
  }

  if (cached) return cached

  throw lastError ?? new Error('Unable to load question paper')
}

export interface ApiAssignmentListEntry {
  id: string
  title: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  dueDate: string
  createdAt: string
}

function formatDisplayDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}`, {
    method: 'DELETE',
  })

  if (response.status === 404) return

  const body = (await response.json()) as { success?: boolean; error?: string }
  if (!response.ok || !body.success) {
    throw new Error(body.error ?? 'Failed to delete assignment')
  }
}

export async function fetchAssignmentsFromApi(): Promise<AssignmentListItem[]> {
  const response = await fetch(`${API_BASE}/api/assignments`, { cache: 'no-store' })
  const body = (await response.json()) as {
    success: boolean
    data?: ApiAssignmentListEntry[]
  }

  if (!response.ok || !body.success || !body.data) {
    return []
  }

  return body.data.map((entry) => ({
    id: entry.id,
    title: entry.title,
    assignedOn: formatDisplayDate(entry.createdAt),
    dueDate: formatDisplayDate(entry.dueDate),
    status: entry.status,
  }))
}

export interface AssignmentStatusResponse {
  success: boolean
  data?: {
    _id: string
    status: 'pending' | 'generating' | 'completed' | 'failed'
    questionPaper?: string
  }
  error?: string
}

export async function fetchAssignmentStatus(
  assignmentId: string,
): Promise<AssignmentStatusResponse['data']> {
  const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}`, {
    cache: 'no-store',
  })
  const body = (await response.json()) as AssignmentStatusResponse

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error ?? 'Failed to fetch assignment status')
  }

  return body.data
}
