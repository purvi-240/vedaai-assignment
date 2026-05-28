import { AppShell } from '@/components/layout/AppShell'
import { AssignmentOutputScreen } from '@/components/assignments/AssignmentOutputScreen'

interface AssignmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { id } = await params

  return (
    <AppShell headerTitle="Create New" showBack pageBarTitle="Create New" variant="filled">
      <AssignmentOutputScreen assignmentId={id} />
    </AppShell>
  )
}
