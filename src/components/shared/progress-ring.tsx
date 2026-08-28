'use client'

import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  sublabel?: string
  color?: string // CSS color, defaults to primary
  trackColor?: string
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 8,
  className,
  label,
  sublabel,
  color,
  trackColor,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor ?? 'var(--muted)'}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color ?? 'var(--primary)'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-sm font-bold leading-none">{label ?? `${Math.round(value)}%`}</div>
        {sublabel && <div className="text-[9px] text-muted-foreground mt-0.5">{sublabel}</div>}
      </div>
    </div>
  )
}
