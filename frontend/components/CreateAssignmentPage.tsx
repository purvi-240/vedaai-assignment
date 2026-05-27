'use client'

import { AssignmentForm } from '@/components/AssignmentForm/AssignmentForm'
import { useWebSocket } from '@/hooks/useWebSocket'

export function CreateAssignmentPage() {
  useWebSocket()

  return (
    <div className="create-assignment-wrap">
      <AssignmentForm />
    </div>
  )
}
