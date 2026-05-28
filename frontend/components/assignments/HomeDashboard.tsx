'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { AssignmentsEmptyState } from './AssignmentsEmptyState'
import {
  loadAssignmentsFromStorage,
  saveAssignmentsToStorage,
} from '@/lib/assignmentListStorage'
import { fetchAssignmentsFromApi } from '@/lib/api/assignments'

/**
 * Figma Home. If the teacher already has assignments, jump straight to the
 * Assignments tab; otherwise show the "No assignments yet" welcome screen.
 */
export function HomeDashboard() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true

    if (loadAssignmentsFromStorage().length > 0) {
      router.replace('/assignments')
      return
    }

    const run = async () => {
      const fromApi = await fetchAssignmentsFromApi()
      if (!active) return

      if (fromApi.length > 0) {
        saveAssignmentsToStorage(fromApi, { notify: false })
        router.replace('/assignments')
        return
      }

      setChecked(true)
    }

    void run()

    return () => {
      active = false
    }
  }, [router])

  return (
    <AppShell
      headerTitle="Assignment"
      showBack={false}
      pageBarTitle="Assignments"
      variant="empty"
    >
      {checked ? (
        <AssignmentsEmptyState />
      ) : (
        <p className="output-state-text">Loading assignments…</p>
      )}
    </AppShell>
  )
}
