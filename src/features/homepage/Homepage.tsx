import { SketchyDivider } from '@/components/sketchy-elements'
import { Link } from '@tanstack/react-router'

// 3D Isometric Block Component
function IsometricBlock({
  x,
  y,
  color,
  progress = 100,
  delay = 0,
}: {
  x: number
  y: number
  color: string
  progress?: number
  delay?: number
}) {
  const size = 40
  const height = 30

  // Isometric projection offsets
  const isoX = (x - y) * (size * 0.866)
  const isoY = (x + y) * (size * 0.5) - (progress / 100) * height

  const colors: Record<string, { top: string; left: string; right: string }> = {
    rust: { top: '#c75c4a', left: '#a84a3a', right: '#8a3d30' },
    sage: { top: '#5b8a72', left: '#4a7360', right: '#3d5f4f' },
    gold: { top: '#c9963a', left: '#a87c30', right: '#8a6628' },
    slate: { top: '#6b83a6', left: '#586d8a', right: '#485a72' },
    warm: { top: '#d4c4b0', left: '#b8a899', right: '#9c8e80' },
  }

  const c = colors[color] || colors.warm

  return (
    <g
      style={{
        transform: `translate(${isoX}px, ${isoY}px)`,
        opacity: 0,
        animation: `block-rise 0.6s ease-out ${delay}s forwards`,
      }}
    >
      {/* Top face */}
      <path
        d={`M0,0 L${size * 0.866},${size * 0.5} L0,${size} L${-size * 0.866},${size * 0.5} Z`}
        fill={c.top}
      />
      {/* Left face */}
      <path
        d={`M${-size * 0.866},${size * 0.5} L0,${size} L0,${size + height} L${-size * 0.866},${size * 0.5 + height} Z`}
        fill={c.left}
      />
      {/* Right face */}
      <path
        d={`M${size * 0.866},${size * 0.5} L0,${size} L0,${size + height} L${size * 0.866},${size * 0.5 + height} Z`}
        fill={c.right}
      />
    </g>
  )
}

// Animated 3D Block Grid
function IsometricBlockGrid() {
  const blocks = [
    // Bottom layer
    { x: 0, y: 0, color: 'rust', progress: 100 },
    { x: 1, y: 0, color: 'sage', progress: 100 },
    { x: 2, y: 0, color: 'gold', progress: 100 },
    { x: 0, y: 1, color: 'slate', progress: 100 },
    { x: 1, y: 1, color: 'warm', progress: 100 },
    { x: 2, y: 1, color: 'rust', progress: 100 },
    { x: 0, y: 2, color: 'gold', progress: 100 },
    { x: 1, y: 2, color: 'sage', progress: 100 },
    { x: 2, y: 2, color: 'slate', progress: 100 },
    // Second layer (stacked)
    { x: 0.5, y: 0.5, color: 'sage', progress: 70 },
    { x: 1.5, y: 0.5, color: 'rust', progress: 85 },
    { x: 0.5, y: 1.5, color: 'gold', progress: 60 },
    { x: 1.5, y: 1.5, color: 'slate', progress: 90 },
    // Top accent
    { x: 1, y: 1, color: 'rust', progress: 45 },
  ]

  return (
    <svg
      viewBox="-150 -20 300 250"
      className="w-full h-full"
      style={{ maxWidth: '400px' }}
    >
      <defs>
        <style>
          {`
            @keyframes block-rise {
              from {
                opacity: 0;
                transform: translate(var(--tx, 0), calc(var(--ty, 0) + 20px));
              }
              to {
                opacity: 1;
                transform: translate(var(--tx, 0), var(--ty, 0));
              }
            }
          `}
        </style>
      </defs>
      <g transform="translate(0, 40)">
        {blocks.map((block, i) => (
          <IsometricBlock
            key={i}
            x={block.x}
            y={block.y}
            color={block.color}
            progress={block.progress}
            delay={0.1 + i * 0.08}
          />
        ))}
      </g>
    </svg>
  )
}

// Feature card component
function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-[var(--journal-cream)] p-6 sketch-border-light hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 flex items-center justify-center bg-[var(--journal-tan)] mb-4"
        style={{ borderRadius: '2px 6px 4px 8px' }}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-[var(--journal-ink)] mb-2">
        {title}
      </h3>
      <p className="text-base text-[var(--journal-ink)] opacity-60 font-serif leading-relaxed">
        {description}
      </p>
    </div>
  )
}

// Sample block preview
function BlockPreview({
  name,
  type,
  progress,
  color,
}: {
  name: string
  type: string
  progress: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    rust: 'var(--journal-rust)',
    sage: 'var(--journal-sage)',
    gold: 'var(--journal-gold)',
    slate: 'var(--journal-slate)',
    warm: 'var(--journal-warm)',
  }

  return (
    <div
      className="bg-[var(--journal-cream)] p-4 sketch-border-light relative overflow-hidden"
      style={{ borderLeftWidth: '4px', borderLeftColor: colorMap[color] }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xl font-bold text-[var(--journal-ink)] leading-tight">
          {name}
        </h4>
        <span
          className="text-xs font-serif text-[var(--journal-ink)] opacity-50 bg-[var(--journal-paper)] px-2 py-0.5"
          style={{ borderRadius: '2px 4px 2px 4px' }}
        >
          {type}
        </span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-serif text-[var(--journal-ink)] opacity-50">
            Progress
          </span>
          <span className="text-lg font-bold text-[var(--journal-ink)]">
            {progress}%
          </span>
        </div>
        <div
          className="h-2 bg-[var(--journal-paper)] overflow-hidden"
          style={{ borderRadius: '1px 3px 2px 4px' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: colorMap[color] }}
          />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--journal-paper)]">
      {/* <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="text-lg font-serif text-[var(--journal-ink)] opacity-60 hover:opacity-100 transition-opacity px-4 py-2"
        >
          Sign In
        </Link>
        <Link
          to="/login"
          className="bg-[var(--journal-ink)] text-[var(--journal-paper)] text-lg font-serif px-5 py-2 hover:bg-[var(--journal-ink)]/90 transition-colors"
          style={{ borderRadius: '3px 8px 5px 10px' }}
        >
          Get Started
        </Link>
      </div> */}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="order-2 md:order-1">
              <h1 className="text-5xl md:text-7xl font-bold text-[var(--journal-ink)] leading-tight text-balance mb-6">
                Build your goals,
                <br />
                <span className="text-[var(--journal-rust)]">
                  block by block
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-[var(--journal-ink)] opacity-60 font-serif leading-relaxed mb-8 text-pretty max-w-lg">
                A visual goal tracker that feels like your favorite bullet
                journal. Stack blocks, track progress, and watch your dreams
                take shape.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-[var(--journal-ink)] text-[var(--journal-paper)] text-xl font-serif px-8 py-4 hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all"
                  style={{ borderRadius: '3px 8px 5px 10px' }}
                >
                  Start Free
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 10h12M12 4l6 6-6 6" />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-[var(--journal-cream)] text-[var(--journal-ink)] text-xl font-serif px-8 py-4 border-2 border-[var(--journal-warm)] hover:bg-[var(--journal-tan)] transition-colors"
                  style={{ borderRadius: '3px 8px 5px 10px' }}
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right: 3D Illustration */}
            <div className="order-1 md:order-2 flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <IsometricBlockGrid />
              </div>
            </div>
          </div>
        </div>

        {/* Subtle dot pattern overlay */}
        <div className="absolute inset-0 paper-dots opacity-30 pointer-events-none" />
      </section>

      <SketchyDivider className="text-[var(--journal-warm)] max-w-6xl mx-auto" />

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--journal-ink)] mb-4">
              How blocks work
            </h2>
            <p className="text-lg text-[var(--journal-ink)] opacity-60 font-serif max-w-2xl mx-auto">
              Each block represents a goal or task. Stack them together, group
              related goals, and visualize your progress in a way that actually
              makes sense.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="Create Blocks"
              description="Define your goals with a name, description, type, and color. Each block becomes a visual piece of your bigger picture."
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--journal-ink)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              }
            />
            <FeatureCard
              title="Track Progress"
              description="Update each block as you make progress. Watch your completion rate grow and celebrate those small wins along the way."
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--journal-ink)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
            <FeatureCard
              title="Group & Stack"
              description="Organize related blocks into groups. See how individual tasks contribute to larger goals and keep everything connected."
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--journal-ink)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="2" y="14" width="20" height="7" rx="1" />
                  <rect x="4" y="8" width="16" height="6" rx="1" />
                  <rect x="6" y="2" width="12" height="6" rx="1" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Block Types Showcase */}
      <section className="py-16 md:py-24 bg-[var(--journal-cream)]/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--journal-ink)] mb-4">
              Track anything
            </h2>
            <p className="text-lg text-[var(--journal-ink)] opacity-60 font-serif max-w-2xl mx-auto">
              From fitness goals to financial milestones, creative projects to
              daily habits - blocks adapt to whatever you are building.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BlockPreview
              name="Morning Run"
              type="Workout"
              progress={65}
              color="rust"
            />
            <BlockPreview
              name="Learn TypeScript"
              type="Skill"
              progress={80}
              color="slate"
            />
            <BlockPreview
              name="Emergency Fund"
              type="Finance"
              progress={100}
              color="gold"
            />
            <BlockPreview
              name="Daily Gratitude"
              type="Mood"
              progress={45}
              color="sage"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--journal-ink)] mb-4 text-balance">
            Ready to start building?
          </h2>
          <p className="text-lg text-[var(--journal-ink)] opacity-60 font-serif mb-8 max-w-xl mx-auto">
            Your goals deserve more than a boring checklist. Give them the
            creative, visual home they need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[var(--journal-ink)] text-[var(--journal-paper)] text-xl font-serif px-8 py-4 hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              Create Your First Block
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 10h12M12 4l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--journal-warm)] py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-base text-[var(--journal-ink)] opacity-40 font-serif">
            BlockJournal - Stack your blocks, build your dreams
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-base text-[var(--journal-ink)] opacity-40 hover:opacity-100 font-serif transition-opacity"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="text-base text-[var(--journal-ink)] opacity-40 hover:opacity-100 font-serif transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
