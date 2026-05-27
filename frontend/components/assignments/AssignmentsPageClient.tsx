'use client'

import { useState } from 'react'
import { mockAssignments } from '@/data/mockAssignments'
import { AssignmentsEmptyState } from './AssignmentsEmptyState'
import { AssignmentsFilledState } from './AssignmentsFilledState'

export function AssignmentsPageClient() {
  const [assignments, setAssignments] = useState(mockAssignments)

  const handleDelete = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id))
  }

  if (assignments.length === 0) {
    return <AssignmentsEmptyState />
  }

  return (
    <AssignmentsFilledState assignments={assignments} onDelete={handleDelete} />
  )
}
