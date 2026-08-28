'use client'

import { ShieldCheck, BadgeCheck, FileQuestion, Timer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type SourceType = 'official_pyq' | 'verified_pyq' | 'practice' | 'mock'

interface SourceBadgeProps {
  sourceType: SourceType
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const SOURCE_CONFIG: Record<SourceType, { label: string; icon: React.ElementType; className: string; description: string }> = {
  official_pyq: {
    label: 'Official PYQ',
    icon: ShieldCheck,
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    description: 'Verified official examination question',
  },
  verified_pyq: {
    label: 'Verified PYQ',
    icon: BadgeCheck,
    className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    description: 'Cross-checked against available official material',
  },
  practice: {
    label: 'Practice',
    icon: FileQuestion,
    className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    description: 'Original question created for additional practice',
  },
  mock: {
    label: 'Mock',
    icon: Timer,
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    description: 'Question generated for exam simulation',
  },
}

export function SourceBadge({ sourceType, size = 'sm', showLabel = true, className }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[sourceType] ?? SOURCE_CONFIG.practice
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium',
        size === 'sm' ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5',
        config.className,
        className,
      )}
      title={config.description}
    >
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {showLabel && config.label}
    </Badge>
  )
}

export { SOURCE_CONFIG }
