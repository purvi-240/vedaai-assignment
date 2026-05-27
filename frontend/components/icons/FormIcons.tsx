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

export function UploadCloudIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 16V8M12 8l-3 3M12 8l3 3" />
      <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 11h16" />
    </svg>
  )
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3z" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...defaults} width={14} height={14} {...props}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function PlusSmallIcon(props: IconProps) {
  return (
    <svg {...defaults} width={14} height={14} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
