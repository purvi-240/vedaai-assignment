import type { QuestionPaper } from '@/lib/normalizeQuestionPaper'

const STORAGE_KEY = 'veda-question-papers'

type QuestionPaperCache = Record<string, QuestionPaper>

function readCache(): QuestionPaperCache {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as QuestionPaperCache)
      : {}
  } catch {
    return {}
  }
}

function writeCache(cache: QuestionPaperCache): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}

export function saveQuestionPaperToCache(
  assignmentId: string,
  paper: QuestionPaper,
): void {
  const cache = readCache()
  cache[assignmentId] = paper
  writeCache(cache)
}

export function loadQuestionPaperFromCache(
  assignmentId: string,
): QuestionPaper | null {
  return readCache()[assignmentId] ?? null
}

export function removeQuestionPaperFromCache(assignmentId: string): void {
  const cache = readCache()
  if (!cache[assignmentId]) return
  delete cache[assignmentId]
  writeCache(cache)
}
