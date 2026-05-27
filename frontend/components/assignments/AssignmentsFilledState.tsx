'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { AssignmentListItem } from '@/types/assignment'
import { AssignmentCard } from './AssignmentCard'
import { AssignmentsToolbar } from './AssignmentsToolbar'

interface AssignmentsFilledStateProps {
  assignments: AssignmentListItem[]
  onDelete: (id: string) => void
}

export function AssignmentsFilledState({
  assignments,
  onDelete,
}: AssignmentsFilledStateProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return assignments
    return assignments.filter((a) => a.title.toLowerCase().includes(q))
  }, [assignments, searchQuery])

  return (
    <div className="assignments-filled">
      <div className="assignments-filled-header desktop-only">
        <div className="assignments-title-row">
          <span className="assignments-status-dot" aria-hidden />
          <h1 className="assignments-page-title">Assignments</h1>
        </div>
        <p className="assignments-page-subtitle">
          Manage and create assignments for your classes.
        </p>
      </div>

      <div className="desktop-only">
        <AssignmentsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="mobile-only">
        <AssignmentsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          mobile
        />
      </div>

      <div className="assignments-grid-wrap">
        <div className="assignments-grid">
          {filtered.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isMenuOpen={openMenuId === assignment.id}
              onMenuToggle={() =>
                setOpenMenuId((id) => (id === assignment.id ? null : assignment.id))
              }
              onMenuClose={() => setOpenMenuId(null)}
              onDelete={onDelete}
            />
          ))}
        </div>
        <div className="assignments-grid-fade" aria-hidden />
      </div>

      <div className="assignments-floating-cta desktop-only">
        <Link href="/assignments/create" className="btn-create-assignment-inline">
          <span className="btn-plus">+</span>
          Create Assignment
        </Link>
      </div>
    </div>
  )
}
