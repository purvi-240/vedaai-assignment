import { AppShell } from '@/components/layout/AppShell'
import { CreateAssignmentPage } from '@/components/CreateAssignmentPage'

export default function CreateAssignmentRoute() {
  return (
    <AppShell headerTitle="Assignment" showBack variant="create">
      <CreateAssignmentPage />
    </AppShell>
  )
}
