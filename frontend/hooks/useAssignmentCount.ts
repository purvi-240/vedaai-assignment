'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadAssignmentsFromStorage } from '@/lib/assignmentListStorage'

import { ASSIGNMENTS_UPDATED_EVENT } from '@/lib/assignmentListStorage'

export function useAssignmentCount(): number {
  const readCount = useCallback(
    () => loadAssignmentsFromStorage().length,
    [],
  )

  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(readCount())

    const refresh = () => setCount(readCount())

    window.addEventListener(ASSIGNMENTS_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener(ASSIGNMENTS_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [readCount])

  return count
}
