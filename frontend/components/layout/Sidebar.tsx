'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { VedaLogo } from '@/components/icons/VedaLogo'
import {
  HomeIcon,
  GroupsIcon,
  AssignmentsIcon,
  ToolkitIcon,
  LibraryIcon,
  SettingsIcon,
  ChevronDownIcon,
  SparkleSmallIcon,
} from '@/components/icons/NavIcons'
import { useAssignmentCount } from '@/hooks/useAssignmentCount'

type NavItem = {
  href: string
  label: string
  icon: typeof HomeIcon
  match?: string
  showAssignmentBadge?: boolean
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/groups', label: 'My Groups', icon: GroupsIcon },
  {
    href: '/assignments',
    label: 'Assignments',
    icon: AssignmentsIcon,
    match: '/assignments',
    showAssignmentBadge: true,
  },
  {
    href: '/assignments/create',
    label: "AI Teacher's Toolkit",
    icon: ToolkitIcon,
    match: '/assignments/create',
  },
  { href: '/library', label: 'My Library', icon: LibraryIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const assignmentCount = useAssignmentCount()

  const isCreatePage = pathname.startsWith('/assignments/create')
  const isOutputPage = pathname.startsWith('/assignments/') && !pathname.startsWith('/assignments/create') && pathname !== '/assignments'

  const isActive = (href: string, match?: string) => {
    const target = match ?? href
    if (target === '/settings') {
      return pathname === '/settings'
    }
    if (target === '/') {
      return pathname === '/' || isOutputPage
    }
    if (target === '/assignments') {
      return pathname === '/assignments'
    }
    if (target === '/assignments/create') {
      return isCreatePage
    }
    return pathname === target || pathname.startsWith(`${target}/`)
  }

  return (
    <>
      <div className="sidebar-top">
        <Link href="/" className="sidebar-logo">
          <VedaLogo size={34} />
          <span className="sidebar-logo-text">VedaAI</span>
        </Link>

        <div className={`btn-create-wrap ${isCreatePage || isOutputPage ? 'btn-create-wrap--active' : ''}`}>
          <Link
            href="/assignments/create"
            className={`btn-create-assignment ${isCreatePage || isOutputPage ? 'btn-create-assignment--active' : ''}`}
          >
            {isOutputPage ? <SparkleSmallIcon /> : <span className="btn-plus">+</span>}
            {isOutputPage ? "AI Teacher's Toolkit" : 'Create Assignment'}
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.match)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''} ${item.showAssignmentBadge && active ? 'active-assignment' : ''}`}
              >
                <Icon />
                <span className="sidebar-nav-label">{item.label}</span>
                {item.showAssignmentBadge && assignmentCount > 0 && (
                  <span className="sidebar-nav-badge">{assignmentCount}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <Link href="/settings" className="sidebar-nav-item settings-item">
          <SettingsIcon />
          <span>Settings</span>
        </Link>

        <Link href="/settings" className="org-profile">
          <div className="org-avatar org-avatar--school">
            <Image
              src="/dps-school-logo.png"
              alt="Delhi Public School"
              width={36}
              height={36}
              className="org-avatar-image"
            />
          </div>
          <div className="org-info">
            <p className="org-name">Delhi Public School</p>
            <p className="org-location">Bokaro Steel City</p>
          </div>
          <ChevronDownIcon className="org-chevron" />
        </Link>
      </div>
    </>
  )
}
