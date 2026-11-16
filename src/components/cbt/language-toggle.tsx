'use client'

import * as React from 'react'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExamLanguage } from '@/lib/exam/types'
import type { CbtQuestionLanguage } from './question-content'

const STORAGE_KEY = 'netprep.cbt.language'

function isQuestionLanguage(value: string | null): value is CbtQuestionLanguage {
  return value === 'en' || value === 'hi'
}

/**
 * Question-language preference for a live attempt. The selection is stored
 * locally so a candidate who chose Hindi keeps it across papers and reloads.
 * Only languages offered by the paper are ever selected.
 */
export function useCbtLanguage(config?: {
  default: ExamLanguage
  available: ExamLanguage[]
} | null): [CbtQuestionLanguage, (language: CbtQuestionLanguage) => void] {
  const fallback: CbtQuestionLanguage = config?.default === 'hi' ? 'hi' : 'en'
  const [language, setLanguageState] =
    React.useState<CbtQuestionLanguage>(fallback)

  const available = React.useMemo(
    () => new Set<ExamLanguage>(config?.available ?? ['en']),
    [config?.available],
  )

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isQuestionLanguage(stored) && available.has(stored)) {
        setLanguageState(stored)
      }
    } catch {
      // Local storage can be unavailable in private or restricted contexts.
    }
  }, [available])

  const setLanguage = React.useCallback(
    (next: CbtQuestionLanguage) => {
      if (!available.has(next)) return
      setLanguageState(next)
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // The in-memory choice still applies for this attempt.
      }
    },
    [available],
  )

  return [language, setLanguage]
}

interface LanguageToggleProps {
  language: CbtQuestionLanguage
  onChange: (language: CbtQuestionLanguage) => void
  available?: readonly ExamLanguage[]
  className?: string
}

export function CbtLanguageToggle({
  language,
  onChange,
  available = ['en'],
  className,
}: LanguageToggleProps) {
  const hindiAvailable = available.includes('hi')
  if (!hindiAvailable) return null

  const options: Array<{ value: CbtQuestionLanguage; label: string; title: string }> =
    [
      { value: 'en', label: 'EN', title: 'English' },
      { value: 'hi', label: 'हिं', title: 'हिंदी' },
    ]

  return (
    <div
      role="group"
      aria-label="Question language / प्रश्न की भाषा"
      className={cn(
        'flex items-center gap-1 border border-slate-300 bg-slate-50 p-0.5',
        className,
      )}
    >
      <Languages className="ml-1 h-3.5 w-3.5 text-slate-500" aria-hidden />
      {options.map((option) => {
        const active = language === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            title={option.title}
            className={cn(
              'px-2 py-1 text-[11px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
              active
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-200',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
