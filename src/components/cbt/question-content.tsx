'use client'

import * as React from 'react'
import { Check, X } from 'lucide-react'
import { Markdown } from '@/components/shared/markdown'
import { cn } from '@/lib/utils'
import type {
  CbtNumericAnswerKey,
  CbtOption,
  CbtResponse,
  CbtReviewQuestion,
  CbtSanitizedQuestion,
} from '@/lib/cbt/types'
import type { QuestionPresentationType, ResponseType } from '@/lib/exam/types'

type QuestionView = Pick<
  CbtSanitizedQuestion | CbtReviewQuestion,
  | 'id'
  | 'responseType'
  | 'presentationType'
  | 'questionText'
  | 'passage'
  | 'codeSnippet'
  | 'tableMarkdown'
  | 'imageUrl'
  | 'options'
>

export interface AnswerReview {
  correctOptionId?: string | null
  correctOptionIds?: string[] | null
  numericAnswer?: CbtNumericAnswerKey | null
  numericPrecision?: number
}

export interface AnswerPatch {
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  numericValue?: string | null
}

interface QuestionBodyProps {
  question: QuestionView
}

export function CbtQuestionBody({ question }: QuestionBodyProps) {
  return (
    <div className="space-y-4">
      {question.passage && (
        <div className="border-l-4 border-slate-400 bg-slate-50 px-4 py-3 text-[14px] text-slate-800">
          <Markdown content={question.passage} />
        </div>
      )}

      <div className="text-[15px] leading-7 text-slate-900">
        <Markdown content={question.questionText} />
      </div>

      {question.codeSnippet && (
        <div className="overflow-hidden border border-slate-300 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-700 px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              Program
            </span>
            <span className="text-[10px] text-slate-400">C</span>
          </div>
          <pre className="max-h-[360px] overflow-auto p-4 text-[13px] leading-6 text-slate-100">
            <code>{question.codeSnippet}</code>
          </pre>
        </div>
      )}

      {question.tableMarkdown && (
        <div className="overflow-x-auto border border-slate-300 bg-white px-3 py-2">
          <Markdown content={question.tableMarkdown} />
        </div>
      )}

      {question.imageUrl && (
        <figure className="border border-slate-300 bg-white p-3">
          {/* Local exam diagrams are static SVG assets. */}
          <img
            src={question.imageUrl}
            alt="Question diagram"
            className="mx-auto max-h-[360px] w-auto max-w-full"
          />
          <figcaption className="mt-2 text-center text-[11px] text-slate-500">
            Figure for the question
          </figcaption>
        </figure>
      )}
    </div>
  )
}

interface AnswerOptionsProps {
  question: QuestionView
  value: CbtResponse | null
  onChange?: (patch: AnswerPatch) => void
  disabled?: boolean
  review?: AnswerReview
}

function optionTone(
  selected: boolean,
  correct: boolean | null,
  reviewing: boolean,
): string {
  if (reviewing && correct) return 'border-emerald-600 bg-emerald-50'
  if (reviewing && selected && correct === false) return 'border-red-500 bg-red-50'
  if (selected) return 'border-slate-900 bg-slate-100'
  return 'border-slate-300 bg-white hover:border-slate-500'
}

function markerTone(
  selected: boolean,
  correct: boolean | null,
  reviewing: boolean,
): string {
  if (reviewing && correct) return 'border-emerald-600 bg-emerald-600 text-white'
  if (reviewing && selected && correct === false) return 'border-red-500 bg-red-500 text-white'
  if (selected) return 'border-slate-900 bg-slate-900 text-white'
  return 'border-slate-400 bg-white text-slate-700'
}

export function CbtAnswerOptions({
  question,
  value,
  onChange,
  disabled = false,
  review,
}: AnswerOptionsProps) {
  const reviewing = Boolean(review)
  const correctIds = React.useMemo(() => {
    if (!review) return null
    if (review.correctOptionIds && review.correctOptionIds.length > 0) {
      return new Set(review.correctOptionIds)
    }
    if (review.correctOptionId) return new Set([review.correctOptionId])
    return new Set<string>()
  }, [review])

  const selectedIds = React.useMemo(() => {
    if (question.responseType === 'single') {
      return new Set(value?.selectedOptionId ? [value.selectedOptionId] : [])
    }
    return new Set(value?.selectedOptionIds ?? [])
  }, [question.responseType, value])

  if (question.responseType === 'numeric') {
    const inputValue =
      value?.numericValue === null || value?.numericValue === undefined
        ? ''
        : String(value.numericValue)
    return (
      <div className="mt-5 space-y-3">
        <label
          htmlFor={`numeric-${question.id}`}
          className="block text-sm font-semibold text-slate-900"
        >
          Numerical answer
        </label>
        <input
          id={`numeric-${question.id}`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={inputValue}
          disabled={disabled || reviewing}
          onChange={(event) => onChange?.({ numericValue: event.target.value })}
          placeholder="Enter a number"
          className={cn(
            'h-11 w-full max-w-xs border-2 border-slate-400 bg-white px-3 font-mono text-base text-slate-900 outline-none',
            'focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-700',
          )}
        />
        <p className="text-xs text-slate-600">
          Enter the numerical value only. Answers are evaluated to{' '}
          {review?.numericPrecision ?? 2} decimal place
          {(review?.numericPrecision ?? 2) === 1 ? '' : 's'}.
        </p>
        {review?.numericAnswer && (
          <p className="text-sm font-semibold text-emerald-800">
            Correct answer: {review.numericAnswer.value}
          </p>
        )}
      </div>
    )
  }

  const multiple = question.responseType === 'multiple'

  return (
    <div className="mt-5 space-y-2.5" role={multiple ? 'group' : 'radiogroup'}>
      {question.options.map((option: CbtOption) => {
        const selected = selectedIds.has(option.id)
        const correct = correctIds ? correctIds.has(option.id) : null
        const wrongSelected = reviewing && selected && correct === false
        return (
          <label
            key={option.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 border-2 px-3 py-3 transition-colors',
              optionTone(selected, correct, reviewing),
              (disabled || reviewing) && 'cursor-default',
            )}
          >
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={`cbt-question-${question.id}`}
              value={option.id}
              checked={selected}
              disabled={disabled || reviewing}
              onChange={() => {
                if (multiple) {
                  const next = new Set(selectedIds)
                  if (next.has(option.id)) next.delete(option.id)
                  else next.add(option.id)
                  onChange?.({ selectedOptionIds: Array.from(next).sort() })
                } else {
                  onChange?.({ selectedOptionId: option.id })
                }
              }}
              className="sr-only"
            />
            <span
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 text-[12px] font-bold',
                markerTone(selected, correct, reviewing),
              )}
            >
              {reviewing && correct ? (
                <Check className="h-3.5 w-3.5" />
              ) : wrongSelected ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                option.label
              )}
            </span>
            <span className="min-w-0 flex-1 text-[14px] leading-6 text-slate-900">
              <Markdown content={option.text} />
            </span>
            {reviewing && correct && (
              <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Correct
              </span>
            )}
            {wrongSelected && (
              <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                Your answer
              </span>
            )}
          </label>
        )
      })}
      {multiple && (
        <p className="text-xs text-slate-600">
          Select all correct options. MSQ answers are marked only when the exact
          combination is selected.
        </p>
      )}
    </div>
  )
}

export function responseAnswerText(
  question: Pick<CbtSanitizedQuestion | CbtReviewQuestion, 'responseType' | 'options'>,
  response: CbtResponse | null,
): string {
  if (!response) return 'Not answered'
  if (question.responseType === 'single') {
    if (!response.selectedOptionId) return 'Not answered'
    const option = question.options.find((entry) => entry.id === response.selectedOptionId)
    return option ? `${option.label}. ${option.text}` : response.selectedOptionId
  }
  if (question.responseType === 'multiple') {
    const ids = response.selectedOptionIds ?? []
    if (ids.length === 0) return 'Not answered'
    return ids
      .map((id) => {
        const option = question.options.find((entry) => entry.id === id)
        return option ? `${option.label}. ${option.text}` : id
      })
      .join('; ')
  }
  if (response.numericValue === null || response.numericValue === undefined) {
    return 'Not answered'
  }
  return String(response.numericValue)
}

export function correctAnswerText(
  question: Pick<CbtSanitizedQuestion | CbtReviewQuestion, 'responseType' | 'options'>,
  review: AnswerReview,
): string {
  if (question.responseType === 'single') {
    if (!review.correctOptionId) return '—'
    const option = question.options.find((entry) => entry.id === review.correctOptionId)
    return option ? `${option.label}. ${option.text}` : review.correctOptionId
  }
  if (question.responseType === 'multiple') {
    const ids = review.correctOptionIds ?? []
    if (ids.length === 0) return '—'
    return ids
      .map((id) => {
        const option = question.options.find((entry) => entry.id === id)
        return option ? `${option.label}. ${option.text}` : id
      })
      .join('; ')
  }
  return review.numericAnswer ? String(review.numericAnswer.value) : '—'
}

export function presentationLabel(type: QuestionPresentationType): string {
  const labels: Record<QuestionPresentationType, string> = {
    text: 'Text',
    passage: 'Passage',
    table: 'Table',
    diagram: 'Diagram',
    code: 'Code',
    mathematical: 'Mathematical',
    'data-interpretation': 'Data interpretation',
  }
  return labels[type] ?? type
}

export function responseTypeLabel(type: ResponseType): string {
  if (type === 'multiple') return 'MSQ'
  if (type === 'numeric') return 'NAT'
  return 'MCQ'
}
