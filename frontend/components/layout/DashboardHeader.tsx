'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BellIcon, ChevronDownIcon, ChevronLeftIcon, GridIcon } from '@/components/icons/NavIcons'

interface DashboardHeaderProps {
  title?: string
  showBack?: boolean
}

export function DashboardHeader({
  title = 'Assignment',
  showBack = true,
}: DashboardHeaderProps) {
  const pathname = usePathname()
  const backHref = pathname.includes('/create') ? '/assignments' : '/assignments'

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        {showBack && (
          <Link href={backHref} className="header-icon-circle" aria-label="Go back">
            <ChevronLeftIcon />
          </Link>
        )}
        <span className="header-icon-circle header-icon-static">
          <GridIcon />
        </span>
        <h1 className="dashboard-header-title">{title}</h1>
      </div>

      <div className="dashboard-header-right">
        <button type="button" className="header-icon-circle header-bell" aria-label="Notifications">
          <BellIcon />
          <span className="notification-dot" />
        </button>
        <button type="button" className="header-user">
          <span className="header-user-name">John Doe</span>
          <div className="header-user-avatar">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
              alt="John Doe"
            />
          </div>
          <ChevronDownIcon />
        </button>
      </div>
    </header>
  )
}
