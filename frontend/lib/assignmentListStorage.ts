import type { AssignmentListItem } from '@/types/assignment'
import { removeQuestionPaperFromCache } from '@/lib/questionPaperStorage'

const STORAGE_KEY = 'veda-assignments-list'

export const ASSIGNMENTS_UPDATED_EVENT = 'veda:assignments-updated'

function notifyAssignmentsUpdated(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(ASSIGNMENTS_UPDATED_EVENT))
}

export function loadAssignmentsFromStorage(): AssignmentListItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is AssignmentListItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as AssignmentListItem).id === 'string' &&
        typeof (item as AssignmentListItem).title === 'string',
    )
  } catch {
    return []
  }
}

export function saveAssignmentsToStorage(
  assignments: AssignmentListItem[],
  options?: { notify?: boolean },
): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  if (options?.notify !== false) {
    notifyAssignmentsUpdated()
  }
}

export function addAssignmentToList(item: AssignmentListItem): void {
  const current = loadAssignmentsFromStorage()
  if (current.some((a) => a.id === item.id)) return
  saveAssignmentsToStorage([item, ...current])
}

export function removeAssignmentFromList(id: string): void {
  saveAssignmentsToStorage(loadAssignmentsFromStorage().filter((a) => a.id !== id))
  removeQuestionPaperFromCache(id)
}

function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export function buildAssignmentListItem(
  assignmentId: string,
  options: { title?: string; dueDate?: string },
): AssignmentListItem {
  const today = formatDisplayDate(new Date())
  return {
    id: assignmentId,
    title: options.title?.trim() || 'Generated Assignment',
    assignedOn: today,
    dueDate: options.dueDate?.trim() || today,
  }
}
