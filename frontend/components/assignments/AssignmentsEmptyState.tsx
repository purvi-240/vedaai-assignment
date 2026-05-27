'use client'

import Link from 'next/link'
import { EmptyAssignmentsIllustration } from '@/components/icons/NavIcons'

export function AssignmentsEmptyState() {
  return (
    <div className="empty-state">
      <EmptyAssignmentsIllustration />

      <h2 className="empty-state-title">No assignments yet</h2>

      <p className="empty-state-description">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let
        AI assist with grading.
      </p>

      <Link href="/assignments/create" className="btn-primary-dark">
        <span>+</span>
        Create Your First Assignment
      </Link>
    </div>
  )
}
