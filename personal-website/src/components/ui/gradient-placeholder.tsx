import { Brain, Code2, Wrench, FlaskConical, Lightbulb, FolderKanban } from 'lucide-react'

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'AI/ML': Brain,
  'Full-Stack': Code2,
  'Developer Tools': Wrench,
  Research: FlaskConical,
  Productivity: Lightbulb,
}

interface GradientPlaceholderProps {
  category?: string
  className?: string
}

export function GradientPlaceholder({ category, className }: GradientPlaceholderProps) {
  const Icon = (category && categoryIcons[category]) || FolderKanban

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[var(--accent-neon)]/20 via-[var(--accent-neon)]/5 to-transparent ${className ?? ''}`}
    >
      <Icon className="h-12 w-12 text-[var(--accent-neon)]/40" />
    </div>
  )
}
