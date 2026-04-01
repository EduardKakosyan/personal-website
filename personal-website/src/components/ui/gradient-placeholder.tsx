import { Brain, Code2, Wrench, FlaskConical, Lightbulb, FolderKanban } from 'lucide-react'

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'AI/ML': Brain,
  'Full-Stack': Code2,
  'Developer Tools': Wrench,
  Research: FlaskConical,
  Productivity: Lightbulb,
}

const categoryThemes: Record<
  string,
  {
    bg: string
    orb1: string
    orb2: string
    orb3: string
    icon: string
    ring: string
    lines: string
  }
> = {
  'AI/ML': {
    bg: 'bg-[#080c1a]',
    orb1: 'bg-violet-500/50',
    orb2: 'bg-cyan-400/40',
    orb3: 'bg-blue-500/30',
    icon: 'text-cyan-300/80',
    ring: 'border-cyan-400/10',
    lines: 'rgba(139,92,246,0.06)',
  },
  'Full-Stack': {
    bg: 'bg-[#071410]',
    orb1: 'bg-emerald-500/50',
    orb2: 'bg-teal-300/40',
    orb3: 'bg-green-500/30',
    icon: 'text-emerald-300/80',
    ring: 'border-emerald-400/10',
    lines: 'rgba(16,185,129,0.06)',
  },
  'Developer Tools': {
    bg: 'bg-[#14100a]',
    orb1: 'bg-amber-500/50',
    orb2: 'bg-orange-400/40',
    orb3: 'bg-yellow-500/25',
    icon: 'text-amber-300/80',
    ring: 'border-amber-400/10',
    lines: 'rgba(245,158,11,0.06)',
  },
  Research: {
    bg: 'bg-[#110818]',
    orb1: 'bg-purple-500/50',
    orb2: 'bg-pink-400/35',
    orb3: 'bg-indigo-500/30',
    icon: 'text-purple-300/80',
    ring: 'border-purple-400/10',
    lines: 'rgba(168,85,247,0.06)',
  },
  Productivity: {
    bg: 'bg-[#081018]',
    orb1: 'bg-sky-500/50',
    orb2: 'bg-blue-400/40',
    orb3: 'bg-indigo-500/30',
    icon: 'text-sky-300/80',
    ring: 'border-sky-400/10',
    lines: 'rgba(56,189,248,0.06)',
  },
}

const defaultTheme = {
  bg: 'bg-[#0e1117]',
  orb1: 'bg-[var(--accent-neon)]/40',
  orb2: 'bg-[var(--accent-neon)]/30',
  orb3: 'bg-[var(--accent-neon)]/20',
  icon: 'text-[var(--accent-neon)]/60',
  ring: 'border-[var(--accent-neon)]/10',
  lines: 'rgba(255,255,255,0.03)',
}

interface GradientPlaceholderProps {
  category?: string
  className?: string
}

export function GradientPlaceholder({ category, className }: GradientPlaceholderProps) {
  const Icon = (category && categoryIcons[category]) || FolderKanban
  const t = (category && categoryThemes[category]) || defaultTheme

  return (
    <div className={`overflow-hidden ${t.bg} ${className ?? ''}`}>
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${t.lines} 1px, transparent 1px), linear-gradient(90deg, ${t.lines} 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Main orbs */}
      <div
        className={`absolute rounded-full ${t.orb1} blur-[80px]`}
        style={{ width: '60%', height: '60%', top: '10%', left: '-5%' }}
      />
      <div
        className={`absolute rounded-full ${t.orb2} blur-[90px]`}
        style={{ width: '55%', height: '55%', bottom: '5%', right: '-5%' }}
      />
      <div
        className={`absolute rounded-full ${t.orb3} blur-[60px]`}
        style={{ width: '40%', height: '50%', top: '25%', left: '35%' }}
      />

      {/* Floating dots */}
      <div
        className={`absolute h-1.5 w-1.5 rounded-full ${t.orb1}`}
        style={{ top: '20%', left: '20%' }}
      />
      <div
        className={`absolute h-1 w-1 rounded-full ${t.orb2}`}
        style={{ top: '30%', right: '22%' }}
      />
      <div
        className={`absolute h-2 w-2 rounded-full ${t.orb1} opacity-40`}
        style={{ bottom: '22%', left: '18%' }}
      />
      <div
        className={`absolute h-1 w-1 rounded-full ${t.orb2} opacity-60`}
        style={{ bottom: '35%', right: '15%' }}
      />
      <div
        className={`absolute h-1.5 w-1.5 rounded-full ${t.orb3}`}
        style={{ top: '55%', left: '70%' }}
      />
      <div
        className={`absolute h-1 w-1 rounded-full ${t.orb1} opacity-50`}
        style={{ top: '70%', left: '30%' }}
      />

      {/* Concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`h-24 w-24 rounded-full border ${t.ring} absolute`} />
        <div className={`h-44 w-44 rounded-full border ${t.ring} absolute`} />
        <div className={`h-64 w-64 rounded-full border ${t.ring} opacity-50 absolute`} />
      </div>

      {/* Icon with glow — centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className={`absolute -inset-6 rounded-full ${t.orb1} blur-3xl`} />
          <Icon className={`relative h-12 w-12 ${t.icon} drop-shadow-lg`} />
        </div>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  )
}
