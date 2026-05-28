'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import type { AssignmentListItem } from '@/types/assignment'
import { deleteAssignment, fetchAssignmentsFromApi } from '@/lib/api/assignments'
import { removeQuestionPaperFromCache } from '@/lib/questionPaperStorage'
import {
  ASSIGNMENTS_UPDATED_EVENT,
  loadAssignmentsFromStorage,
  saveAssignmentsToStorage,
} from '@/lib/assignmentListStorage'
import { AssignmentsEmptyState } from './AssignmentsEmptyState'
import { AssignmentsFilledState } from './AssignmentsFilledState'

export function AssignmentsHomePage() {
  const pathname = usePathname()
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  const refreshAssignments = useCallback(async () => {
    const fromApi = await fetchAssignmentsFromApi()
    if (fromApi.length > 0) {
      saveAssignmentsToStorage(fromApi)
      setAssignments(fromApi)
    } else {
      setAssignments(loadAssignmentsFromStorage())
    }
    setHasLoaded(true)
  }, [])

  useEffect(() => {
    void refreshAssignments()

    const onUpdated = () => void refreshAssignments()
    window.addEventListener(ASSIGNMENTS_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(ASSIGNMENTS_UPDATED_EVENT, onUpdated)
  }, [refreshAssignments])

  useEffect(() => {
    if (pathname === '/assignments') {
      void refreshAssignments()
    }
  }, [pathname, refreshAssignments])

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment(id)
    } catch {
      // Still remove locally if the server entry is already gone or unreachable.
    }

    removeQuestionPaperFromCache(id)
    setAssignments((prev) => {
      const next = prev.filter((a) => a.id !== id)
      saveAssignmentsToStorage(next, { notify: false })
      return next
    })
  }

  const isEmpty = assignments.length === 0

  if (!hasLoaded) {
    return (
      <AppShell headerTitle="Assignment" pageBarTitle="Assignments" variant="empty">
        <p className="output-state-text">Loading assignments…</p>
      </AppShell>
    )
  }

  return (
    <AppShell
      headerTitle="Assignment"
      showBack={!isEmpty}
      pageBarTitle="Assignments"
      variant={isEmpty ? 'empty' : 'filled'}
    >
      {isEmpty ? (
        <AssignmentsEmptyState />
      ) : (
        <AssignmentsFilledState assignments={assignments} onDelete={handleDelete} />
      )}
    </AppShell>
  )
}
