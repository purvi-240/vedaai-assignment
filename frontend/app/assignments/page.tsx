import { AppShell } from '@/components/layout/AppShell'
import { AssignmentsPageClient } from '@/components/assignments/AssignmentsPageClient'

export default function AssignmentsPage() {
  return (
    <AppShell
      headerTitle="Assignment"
      showBack
      pageBarTitle="Assignments"
      variant="filled"
    >
      <AssignmentsPageClient />
    </AppShell>
  )
}
