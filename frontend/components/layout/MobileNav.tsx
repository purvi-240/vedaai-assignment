'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { VedaLogo } from '@/components/icons/VedaLogo'
import {
  HomeIcon,
  AssignmentsIcon,
  LibraryIcon,
  ToolkitIcon,
  BellIcon,
  ChevronLeftIcon,
  GridIcon,
} from '@/components/icons/NavIcons'

const mobileNavItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/assignments', label: 'Assignments', icon: AssignmentsIcon },
  { href: '#', label: 'Library', icon: LibraryIcon },
  { href: '#', label: 'AI Toolkit', icon: ToolkitIcon },
]

export function MobileStatusBar() {
  return (
    <div className="mobile-status-bar" aria-hidden>
      <div className="mobile-status-bar-inner">
        <span className="mobile-status-time">9:41</span>
        <div className="mobile-status-icons">
          <span className="mobile-signal" />
          <span className="mobile-wifi" />
          <span className="mobile-battery" />
        </div>
      </div>
    </div>
  )
}

export function MobileHeader() {
  return (
    <>
      <MobileStatusBar />
      <header className="mobile-header">
        <Link href="/assignments" className="mobile-header-logo">
          <VedaLogo size={30} />
          <span>VedaAI</span>
        </Link>
        <div className="mobile-header-actions">
          <button type="button" className="header-icon-circle header-bell" aria-label="Notifications">
            <BellIcon />
            <span className="notification-dot" />
          </button>
          <div className="header-user-avatar mobile">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
              alt="John Doe"
            />
          </div>
          <button type="button" className="mobile-menu-btn" aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
    </>
  )
}

interface MobilePageBarProps {
  title?: string
}

export function MobilePageBar({ title = 'Assignment' }: MobilePageBarProps) {
  const pathname = usePathname()
  const backHref = pathname.includes('/create') ? '/assignments' : '/assignments'
  const showGrid = !pathname.match(/^\/assignments\/?$/)

  return (
    <div className="mobile-page-bar">
      <Link href={backHref} className="header-icon-circle" aria-label="Go back">
        <ChevronLeftIcon />
      </Link>
      {showGrid && (
        <span className="header-icon-circle header-icon-static">
          <GridIcon />
        </span>
      )}
      <span className="mobile-page-bar-title">{title}</span>
    </div>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <div className="mobile-bottom-nav-wrapper">
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href) && item.href !== '#'

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function MobileFab() {
  return (
    <Link href="/assignments/create" className="mobile-fab" aria-label="Create assignment">
      <span className="mobile-fab-plus">+</span>
    </Link>
  )
}
