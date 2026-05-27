import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const defaults = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function GroupsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19c0-2.5 2.5-4 6-4s6 1.5 6 4" />
      <path d="M15 17.5c0-1.8 1.5-3 4-3" />
    </svg>
  )
}

export function AssignmentsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M8 4h11a2 2 0 0 1 2 2v14H8V4z" />
      <path d="M8 4a2 2 0 0 0-2 2v14h2" />
      <path d="M12 9h6M12 13h6M12 17h4" />
    </svg>
  )
}

export function ToolkitIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 6h2M11 18h2" />
    </svg>
  )
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M15 17H9l1-1v-4a4 4 0 1 1 8 0v4l1 1z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...defaults} width={16} height={16} {...props}>
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...defaults} width={18} height={18} {...props}>
      <path d="M11 4L5 9l6 5" />
    </svg>
  )
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...defaults} width={18} height={18} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...defaults} width={18} height={18} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l4 4" />
    </svg>
  )
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...defaults} width={18} height={18} {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

export function MoreVerticalIcon(props: IconProps) {
  return (
    <svg {...defaults} width={20} height={20} {...props}>
      <circle cx="12" cy="6" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SparkleSmallIcon(props: IconProps) {
  return (
    <svg {...defaults} width={16} height={16} {...props}>
      <path d="M12 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM4 10l.5 1.5L6 12l-1.5.5L4 14l-.5-1.5L2 12l1.5-.5L4 10z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function EmptyAssignmentsIllustration() {
  return (
    <svg
      width="220"
      height="180"
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Document */}
      <rect x="48" y="24" width="104" height="132" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
      <rect x="64" y="48" width="72" height="6" rx="3" fill="#E5E7EB" />
      <rect x="64" y="64" width="56" height="6" rx="3" fill="#E5E7EB" />
      <rect x="64" y="80" width="64" height="6" rx="3" fill="#E5E7EB" />
      <rect x="64" y="96" width="48" height="6" rx="3" fill="#E5E7EB" />
      <rect x="64" y="112" width="60" height="6" rx="3" fill="#E5E7EB" />
      <rect x="64" y="128" width="40" height="6" rx="3" fill="#E5E7EB" />
      {/* Magnifying glass */}
      <circle cx="142" cy="108" r="38" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="2.5" />
      <circle cx="142" cy="108" r="26" stroke="#9CA3AF" strokeWidth="3" fill="none" />
      <line x1="168" y1="134" x2="188" y2="154" stroke="#9CA3AF" strokeWidth="3.5" strokeLinecap="round" />
      {/* Red X badge */}
      <circle cx="142" cy="108" r="14" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
      <line x1="135" y1="108" x2="149" y2="108" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="142" y1="101" x2="142" y2="115" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
