import type { ImgHTMLAttributes, SVGProps } from 'react'

/** Matches viewBox of `public/logo 2.svg` (80×71). */
const LOGO_ASPECT = 71 / 80

const LOGO_SRC = '/logo-2.svg'

interface VedaLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> {
  size?: number
}

export function VedaLogo({ size = 32, className, style, ...props }: VedaLogoProps) {
  const height = Math.round(size * LOGO_ASPECT)

  return (
    <img
      src={LOGO_SRC}
      alt="VedaAI"
      width={size}
      height={height}
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...props}
    />
  )
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  )
}
