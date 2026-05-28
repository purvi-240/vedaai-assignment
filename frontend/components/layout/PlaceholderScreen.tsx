import Link from 'next/link'
import { AppShell } from './AppShell'

interface PlaceholderScreenProps {
  title: string
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <AppShell headerTitle="Assignment" pageBarTitle={title} variant="empty">
      <div className="placeholder-screen">
        <h2 className="placeholder-screen-title">{title}</h2>
        <p className="placeholder-screen-text">This section is coming soon.</p>
        <Link href="/" className="btn-primary-dark">
          Back to Home
        </Link>
      </div>
    </AppShell>
  )
}
