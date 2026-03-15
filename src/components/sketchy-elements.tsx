export function SketchyDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 12"
      className={`w-full h-3 ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0 6 Q20 2, 40 6 T80 5 T120 7 T160 4 T200 6 T240 5 T280 7 T320 4 T360 6 T400 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}

export function SketchyBox({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'dashed' | 'double'
}) {
  const svgBorder = {
    default: (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          rx="3"
          ry="8"
          fill="none"
          stroke="var(--journal-ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="none"
          style={{
            filter: 'url(#sketchy)',
          }}
        />
        <defs>
          <filter id="sketchy">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.03"
              numOctaves="4"
              seed="2"
            />
            <feDisplacementMap in="SourceGraphic" scale="1.5" />
          </filter>
        </defs>
      </svg>
    ),
    dashed: (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          rx="3"
          ry="8"
          fill="none"
          stroke="var(--journal-warm)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />
      </svg>
    ),
    double: (
      <>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <rect
            x="4"
            y="4"
            width="calc(100% - 8px)"
            height="calc(100% - 8px)"
            rx="2"
            ry="6"
            fill="none"
            stroke="var(--journal-ink)"
            strokeWidth="1.5"
          />
          <rect
            x="7"
            y="7"
            width="calc(100% - 14px)"
            height="calc(100% - 14px)"
            rx="3"
            ry="5"
            fill="none"
            stroke="var(--journal-ink)"
            strokeWidth="0.75"
          />
        </svg>
      </>
    ),
  }

  return (
    <div className={`relative ${className}`}>
      {svgBorder[variant]}
      {children}
    </div>
  )
}

export function SketchyArrow({
  direction = 'right',
  className = '',
}: {
  direction?: 'right' | 'down'
  className?: string
}) {
  if (direction === 'down') {
    return (
      <svg viewBox="0 0 20 30" className={`w-5 h-8 ${className}`}>
        <path
          d="M10 2 L10 24 M4 18 L10 26 L16 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 30 20" className={`w-8 h-5 ${className}`}>
      <path
        d="M2 10 L24 10 M18 4 L26 10 L18 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DoodleStar({
  className = '',
  size = 24,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <path
        d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DoodleCircle({
  className = '',
  size = 24,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <path
        d="M12 3 C18 2, 22 7, 21 12 C22 18, 17 22, 12 21 C6 22, 2 18, 3 12 C2 6, 7 2, 12 3 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DoodleCheckmark({
  className = '',
  size = 20,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className={className}>
      <path
        d="M4 10 L8 15 L16 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PaperClipDecoration({
  className = '',
}: {
  className?: string
}) {
  return (
    <svg viewBox="0 0 20 40" width={20} height={40} className={className}>
      <path
        d="M14 4 L14 30 C14 35, 6 35, 6 30 L6 10 C6 6, 10 6, 10 10 L10 26"
        fill="none"
        stroke="var(--journal-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}
