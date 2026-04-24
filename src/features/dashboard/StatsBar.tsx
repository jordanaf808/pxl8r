import {
  DoodleStar,
  DoodleCircle,
  DoodleCheckmark,
} from '@/components/sketchy-elements'
import type { Cell, Pixel } from '@/db/types'
import { computeGlobalStats } from '@/lib/utils/stats'

interface StatsBarProps {
  pixels: Pixel[]
  cells: Cell[]
  gridCount?: number
}

export function StatsBar({ pixels, cells, gridCount = 0 }: StatsBarProps) {
  const {
    totalCells,
    completedCount: completedCells,
    remainingCells,
    avgProgress,
    avgCompletionDays,
    completedWithTime,
  } = computeGlobalStats(pixels, cells, gridCount)

  const stats = [
    {
      label: 'Total Pixels',
      value: totalCells,
      icon: <DoodleStar size={22} className="text-[var(--journal-gold)]" />,
      color: 'var(--journal-gold)',
    },
    {
      label: 'Grids',
      value: gridCount,
      icon: (
        <svg
          viewBox="0 0 22 22"
          width={22}
          height={22}
          className="text-[var(--journal-warm)]"
        >
          <rect
            x="2"
            y="12"
            width="18"
            height="7"
            rx="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect
            x="4"
            y="7"
            width="14"
            height="5"
            rx="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect
            x="6"
            y="2"
            width="10"
            height="5"
            rx="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
      color: 'var(--journal-warm)',
    },
    {
      label: 'Remaining',
      value: remainingCells,
      icon: <DoodleCircle size={22} className="text-[var(--journal-rust)]" />,
      color: 'var(--journal-rust)',
    },
    {
      label: 'Completed',
      value: completedCells,
      icon: (
        <DoodleCheckmark size={22} className="text-[var(--journal-sage)]" />
      ),
      color: 'var(--journal-sage)',
    },
    {
      label: 'Avg. Days',
      value: completedWithTime.length > 0 ? avgCompletionDays : '--',
      icon: (
        <svg
          viewBox="0 0 22 22"
          width={22}
          height={22}
          className="text-[var(--journal-slate)]"
        >
          <circle
            cx="11"
            cy="11"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M11 6v6l4 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      color: 'var(--journal-slate)',
    },
  ]

  return (
    <div
      className="bg-[var(--journal-cream)] sketch-border p-5 md:p-6 relative"
      style={{ transform: 'rotate(0.3deg)' }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          className="text-[var(--journal-ink)]"
        >
          <path
            d="M4 20h16 M4 20V8l4-4h8l4 4v12 M9 20v-6h6v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="text-2xl font-bold text-[var(--journal-ink)]">
          My Journal Stats
        </h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center p-3 bg-[var(--journal-paper)] transition-transform hover:-translate-y-0.5"
            style={{
              borderRadius: '3px 8px 5px 10px',
              border: `1.5px solid var(--journal-warm)`,
            }}
          >
            <div className="mb-1">{stat.icon}</div>
            <span className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </span>
            <span className="text-sm text-[var(--journal-ink)] opacity-60 font-serif text-center">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Overall progress visualization */}
      {totalCells > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-serif text-[var(--journal-ink)] opacity-70">
              Overall Progress
            </span>
            <span className="text-lg font-bold text-[var(--journal-ink)]">
              {avgProgress}%
            </span>
          </div>
          <div
            className="relative w-full h-5 bg-[var(--journal-paper)] overflow-hidden"
            style={{
              borderRadius: '3px 8px 5px 10px',
              border: '1.5px solid var(--journal-warm)',
            }}
          >
            <div
              className="h-full bg-[var(--journal-sage)] transition-all duration-700 ease-out"
              style={{
                width: `${avgProgress}%`,
                borderRadius: '2px 6px 4px 8px',
              }}
            />
            {/* Tick marks */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute top-0 h-full w-px bg-[var(--journal-warm)]"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
          {/* Pixel visualization row */}
          <div className="flex gap-1 mt-3 flex-wrap">
            {pixels.map((pixel) => (
              <div
                key={pixel.id}
                className="h-3 transition-all"
                style={{
                  width: `${Math.max(100 / Math.max(totalCells, 1) - 1, 8)}%`,
                  minWidth: '12px',
                  backgroundColor: `var(--journal-${pixel.color})`,
                  borderRadius: '1px 3px 2px 4px',
                }}
                title={`${pixel.name}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
