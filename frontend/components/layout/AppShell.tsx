'use client'

import { Sidebar } from './Sidebar'
import { DashboardHeader } from './DashboardHeader'
import { MobileHeader, MobilePageBar, MobileBottomNav, MobileFab } from './MobileNav'

interface AppShellProps {
  children: React.ReactNode
  headerTitle?: string
  showBack?: boolean
  pageBarTitle?: string
  variant?: 'empty' | 'filled' | 'create'
}

export function AppShell({
  children,
  headerTitle,
  showBack,
  pageBarTitle,
  variant = 'empty',
}: AppShellProps) {
  return (
    <div className={`app-shell app-shell--${variant}`}>
      <aside className="sidebar-card">
        <Sidebar />
      </aside>

      <div className="main-panel">
        <div className="desktop-only">
          <DashboardHeader title={headerTitle} showBack={showBack} />
        </div>

        <MobileHeader />
        <MobilePageBar title={pageBarTitle ?? headerTitle} />

        <main className={`app-content app-content--${variant === 'create' ? 'create' : variant}`}>
          {children}
        </main>
      </div>

      <MobileFab />
      <MobileBottomNav />
    </div>
  )
}
