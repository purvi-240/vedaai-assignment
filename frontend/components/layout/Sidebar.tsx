'use client'

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
} from '@/components/icons/NavIcons'
import { ASSIGNMENTS_BADGE_COUNT } from '@/data/mockAssignments'

type NavItem = {
  href: string
  label: string
  icon: typeof HomeIcon
  match?: string
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '#', label: 'My Groups', icon: GroupsIcon },
  {
    href: '/assignments',
    label: 'Assignments',
    icon: AssignmentsIcon,
    match: '/assignments',
    badge: ASSIGNMENTS_BADGE_COUNT,
  },
  { href: '#', label: "AI Teacher's Toolkit", icon: ToolkitIcon },
  { href: '#', label: 'My Library', icon: LibraryIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  const isCreatePage = pathname.startsWith('/assignments/create')

  const isActive = (href: string, match?: string) => {
    const target = match ?? href
    if (target === '/') return pathname === '/'
    if (target === '/assignments') {
      return (
        pathname === '/assignments' ||
        (pathname.startsWith('/assignments/') && !pathname.startsWith('/assignments/create'))
      )
    }
    return pathname.startsWith(target)
  }

  return (
    <>
      <div className="sidebar-top">
        <Link href="/assignments" className="sidebar-logo">
          <VedaLogo size={34} />
          <span className="sidebar-logo-text">VedaAI</span>
        </Link>

        <div className={`btn-create-wrap ${isCreatePage ? 'btn-create-wrap--active' : ''}`}>
          <Link
            href="/assignments/create"
            className={`btn-create-assignment ${isCreatePage ? 'btn-create-assignment--active' : ''}`}
          >
            <span className="btn-plus">+</span>
            Create Assignment
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
                className={`sidebar-nav-item ${active ? 'active' : ''} ${item.badge !== undefined && active ? 'active-assignment' : ''}`}
              >
                <Icon />
                <span className="sidebar-nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="sidebar-nav-badge">{item.badge}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <Link href="#" className="sidebar-nav-item settings-item">
          <SettingsIcon />
          <span>Settings</span>
        </Link>

        <button type="button" className="org-profile">
          <div className="org-avatar">
            <img
              src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=School"
              alt="Delhi Public School"
            />
          </div>
          <div className="org-info">
            <p className="org-name">Delhi Public School</p>
            <p className="org-location">Bokaro Steel City</p>
          </div>
          <ChevronDownIcon className="org-chevron" />
        </button>
      </div>
    </>
  )
}
