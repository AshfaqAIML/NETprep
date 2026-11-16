'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  questionStatus,
  statusLabel,
  type CbtQuestionStatus,
} from '@/lib/cbt/status'
import type {
  CbtAttemptCounts,
  CbtPaperSection,
  CbtResponses,
  CbtSanitizedQuestion,
} from '@/lib/cbt/types'

const STATUS_BUTTON: Record<CbtQuestionStatus, string> = {
  'not-visited':
    'border-slate-400 bg-white text-slate-700 hover:border-slate-700 hover:bg-slate-50',
  'not-answered':
    'border-red-700 bg-red-700 text-white hover:bg-red-800',
  answered:
    'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800',
  marked:
    'border-violet-700 bg-violet-700 text-white hover:bg-violet-800',
  'answered-marked':
    'border-violet-700 bg-violet-700 text-white hover:bg-violet-800',
}

const STATUS_SWATCH: Record<CbtQuestionStatus, string> = {
  'not-visited': 'border border-slate-400 bg-white',
  'not-answered': 'bg-red-700',
  answered: 'bg-emerald-700',
  marked: 'bg-violet-700',
  'answered-marked': 'bg-violet-700',
}

const LEGEND_ORDER: CbtQuestionStatus[] = [
  'not-visited',
  'not-answered',
  'answered',
  'marked',
  'answered-marked',
]

export function PaletteLegend({
  counts,
  className,
}: {
  counts: CbtAttemptCounts
  className?: string
}) {
  const values: Record<CbtQuestionStatus, number> = {
    'not-visited': counts.notVisited,
    'not-answered': counts.notAnswered,
    answered: counts.answered,
    marked: counts.marked,
    'answered-marked': counts.answeredMarked,
  }

  return (
    <ul className={cn('space-y-1.5', className)}>
      {LEGEND_ORDER.map((status) => (
        <li key={status} className="flex items-center justify-between gap-3 text-[11px]">
          <span className="flex min-w-0 items-center gap-2 text-slate-700">
            <span
              aria-hidden="true"
              className={cn(
                'relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center',
                STATUS_SWATCH[status],
              )}
            >
              {status === 'answered-marked' && (
                <span className="absolute -bottom-1 -right-1 h-2 w-2 border border-white bg-emerald-400" />
              )}
            </span>
            <span className="truncate">{statusLabel(status)}</span>
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {values[status]}
          </span>
        </li>
      ))}
    </ul>
  )
}

interface QuestionPaletteProps {
  sections: CbtPaperSection[]
  questions: CbtSanitizedQuestion[]
  responses: CbtResponses
  counts: CbtAttemptCounts
  currentQuestionId: string | null
  onSelect: (questionId: string) => void
  className?: string
}

export function QuestionPalette({
  sections,
  questions,
  responses,
  counts,
  currentQuestionId,
  onSelect,
  className,
}: QuestionPaletteProps) {
  const groups = React.useMemo(() => {
    const bySection = new Map<string, CbtSanitizedQuestion[]>()
    for (const question of questions) {
      const list = bySection.get(question.sectionId) ?? []
      list.push(question)
      bySection.set(question.sectionId, list)
    }

    const ordered = sections
      .filter((section) => (bySection.get(section.id)?.length ?? 0) > 0)
      .map((section) => ({
        section,
        questions: bySection.get(section.id) ?? [],
      }))

    const known = new Set(ordered.map((group) => group.section.id))
    const remaining = questions.filter((question) => !known.has(question.sectionId))
    if (remaining.length > 0) {
      ordered.push({
        section: {
          id: 'other',
          code: 'OTHER',
          name: 'Other questions',
          kind: 'custom',
          order: Number.MAX_SAFE_INTEGER,
          marks: remaining.reduce((sum, question) => sum + question.marks, 0),
          questionCount: remaining.length,
          parentIds: [],
          parentNames: [],
        },
        questions: remaining,
      })
    }

    return ordered
  }, [questions, sections])

  return (
    <div className={cn('space-y-5', className)}>
      {groups.map((group) => {
        const answered = group.questions.filter(
          (question) =>
            questionStatus(question, responses[question.id]) === 'answered' ||
            questionStatus(question, responses[question.id]) === 'answered-marked',
        ).length

        return (
          <section key={group.section.id} aria-label={group.section.name}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                {group.section.name}
              </h3>
              <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                {answered}/{group.questions.length}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
              {group.questions.map((question) => {
                const status = questionStatus(question, responses[question.id])
                const current = question.id === currentQuestionId
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => onSelect(question.id)}
                    aria-label={`Question ${question.number}, ${statusLabel(status)}`}
                    aria-current={current ? 'true' : undefined}
                    className={cn(
                      'relative flex h-9 min-w-0 items-center justify-center border px-1 text-[12px] font-semibold tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1',
                      STATUS_BUTTON[status],
                      current && 'ring-2 ring-slate-900 ring-offset-2',
                    )}
                  >
                    {question.number}
                    {status === 'answered-marked' && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 border border-white bg-emerald-400"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="border-t border-slate-300 pt-3">
        <PaletteLegend counts={counts} />
      </div>
    </div>
  )
}
