'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Markdown } from '@/components/shared/markdown'
import { CbtLanguageToggle, useCbtLanguage } from '@/components/cbt/language-toggle'
import {
  CbtAnswerOptions,
  CbtQuestionBody,
  correctAnswerText,
  responseAnswerText,
  responseTypeLabel,
} from '@/components/cbt/question-content'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  clearCbtRoute,
  clearExamHash,
} from '@/lib/cbt/client'
import {
  formatClock,
  formatDuration,
  formatScore,
  signedScore,
} from '@/lib/cbt/status'
import type {
  CbtPaperPerformance,
  CbtResult,
  CbtReviewQuestion,
  CbtUnitPerformance,
} from '@/lib/cbt/types'
import type { ExamLanguage, QuestionOutcome } from '@/lib/exam/types'

type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'marked'

const OUTCOME_LABEL: Record<QuestionOutcome, string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  partial: 'Partial',
  unanswered: 'Unanswered',
  'dropped-bonus': 'Dropped — bonus',
  dropped: 'Dropped',
}

function outcomeTone(outcome: QuestionOutcome): string {
  switch (outcome) {
    case 'correct':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'incorrect':
      return 'border-red-300 bg-red-50 text-red-800'
    case 'partial':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'dropped-bonus':
      return 'border-blue-300 bg-blue-50 text-blue-800'
    case 'dropped':
      return 'border-slate-300 bg-slate-100 text-slate-700'
    default:
      return 'border-slate-300 bg-slate-100 text-slate-700'
  }
}

function scoreTone(value: number): string {
  if (value > 0) return 'text-emerald-800'
  if (value < 0) return 'text-red-800'
  return 'text-slate-600'
}

function dateTimeLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function matchesFilter(question: CbtReviewQuestion, filter: ReviewFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'marked') return question.markedForReview
  if (filter === 'unanswered') return question.outcome === 'unanswered'
  if (filter === 'incorrect') {
    return question.outcome === 'incorrect' || question.outcome === 'partial'
  }
  return question.outcome === 'correct' || question.outcome === 'dropped-bonus'
}

export function ExamResultView() {
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)
  const attemptId =
    typeof viewParams.attemptId === 'string' ? viewParams.attemptId : ''

  const [result, setResult] = React.useState<CbtResult | null>(null)
  const [language, setLanguage] = useCbtLanguage(result?.language)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [filter, setFilter] = React.useState<ReviewFilter>('all')
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (!attemptId) {
      setError('No examination attempt was selected.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .examResult(attemptId)
      .then((response) => {
        if (cancelled) return
        setResult(response.result)
        setLoading(false)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'The examination result could not be loaded.',
        )
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attemptId, reloadKey])

  const goBack = React.useCallback(() => {
    clearCbtRoute()
    clearExamHash()
    navigate('mock-tests')
  }, [navigate])

  const reattempt = React.useCallback(() => {
    if (!result) return
    clearCbtRoute()
    navigate('exam-instructions', { profileCode: result.profile.code })
  }, [navigate, result])

  const toggleExpanded = React.useCallback((questionId: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl border border-slate-300 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Result unavailable
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {error ?? 'The examination result could not be loaded.'}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setReloadKey((value) => value + 1)}
              className="gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="gap-1.5 rounded-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Mock Tests
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const totals = result.totals
  const answeredTotal = totals.answered
  const filters: Array<{ key: ReviewFilter; label: string; count: number }> = [
    { key: 'all', label: 'All questions', count: result.review.length },
    {
      key: 'correct',
      label: 'Correct',
      count: result.review.filter((question) => matchesFilter(question, 'correct')).length,
    },
    {
      key: 'incorrect',
      label: 'Incorrect',
      count: result.review.filter((question) => matchesFilter(question, 'incorrect'))
        .length,
    },
    {
      key: 'unanswered',
      label: 'Unanswered',
      count: result.review.filter((question) => matchesFilter(question, 'unanswered'))
        .length,
    },
    {
      key: 'marked',
      label: 'Marked for review',
      count: result.review.filter((question) => question.markedForReview).length,
    },
  ]
  const visible = result.review.filter((question) => matchesFilter(question, filter))

  // A parent group and its children can both appear in the score breakdown.
  // Show the leaf sections only so the table does not double-count a group.
  const parentSectionIds = new Set(
    result.sections.flatMap((section) => section.parentSectionIds),
  )
  const sectionRows = result.sections.filter(
    (section) => !parentSectionIds.has(section.sectionId),
  )
  const paperRows = result.papers ?? []
  const unitRows = result.units ?? []
  const languageOptions: ExamLanguage[] =
    result.language?.available ??
    (result.review.some((question) => question.hindi) ? ['en', 'hi'] : ['en'])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-slate-900 text-white">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">NETPrep Examination Centre</div>
              <div className="text-[11px] text-slate-600">
                Computer-based test · Result
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CbtLanguageToggle
              language={language}
              onChange={setLanguage}
              available={languageOptions}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="gap-1.5 rounded-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Mock Tests
            </Button>
            <Button
              size="sm"
              onClick={reattempt}
              className="gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Take again
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-700 bg-slate-900 px-5 py-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/30 bg-white/10 text-white">
                {result.profile.family === 'GATE' ? 'GATE' : 'UGC NET'}
              </Badge>
              <Badge className="border-white/30 bg-white/10 text-white">
                {result.submittedReason === 'timer_expired'
                  ? 'Auto-submitted at expiry'
                  : 'Submitted by candidate'}
              </Badge>
            </div>
            <h1 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">
              {result.profile.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300">
              <span>
                Candidate: <span className="text-white">{result.candidate.name}</span>
              </span>
              <span className="font-mono">{result.candidate.id}</span>
              <span>Submitted: {dateTimeLabel(result.submittedAt)}</span>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <Award className="h-3.5 w-3.5" />
                Final score
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {formatScore(totals.finalScore)}
                <span className="ml-1 text-sm font-medium text-slate-500">
                  / {formatScore(totals.maxMarks)}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {formatScore(totals.percentage, 1)}% of maximum marks
              </div>
            </div>

            <div className="border border-slate-300 bg-white p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <Target className="h-3.5 w-3.5" />
                Accuracy
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {formatScore(totals.accuracy, 1)}%
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Based on attempted questions
              </div>
            </div>

            <div className="border border-slate-300 bg-white p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <BarChart3 className="h-3.5 w-3.5" />
                Correct / incorrect
              </div>
              <div className="mt-1 flex items-baseline gap-2 text-2xl font-bold tabular-nums">
                <span className="text-emerald-800">{totals.correct}</span>
                <span className="text-slate-400">/</span>
                <span className="text-red-800">{totals.incorrect}</span>
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {totals.unanswered} unanswered · {totals.partial} partial
              </div>
            </div>

            <div className="border border-slate-300 bg-white p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Time used
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {formatDuration(result.timeSpentSec)}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                of {formatDuration(result.durationSec)} allowed
              </div>
            </div>
          </div>

          <div className="grid gap-0 border-t border-slate-300 sm:grid-cols-3">
            <ResultStat
              icon={CheckCircle2}
              label="Questions answered"
              value={`${answeredTotal} / ${totals.questionCount}`}
            />
            <ResultStat
              icon={XCircle}
              label="Negative marking"
              value={
                totals.penalty > 0
                  ? `−${formatScore(totals.penalty)} marks`
                  : 'None'
              }
            />
            <ResultStat
              icon={Award}
              label="Marks awarded"
              value={formatScore(totals.marksAwarded)}
            />
          </div>
        </section>

        {sectionRows.length > 0 && paperRows.length === 0 && (
          <section className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Section performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Section
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Questions
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Correct
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Incorrect
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Unanswered
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Penalty
                    </th>
                    <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sectionRows.map((section) => (
                    <tr key={section.sectionId}>
                      <td className="border-b border-slate-200 px-3 py-2.5 font-medium text-slate-900">
                        {section.sectionName}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                        {section.questionCount}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-emerald-800">
                        {section.correct}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-red-800">
                        {section.incorrect}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                        {section.unanswered}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                        {section.penalty > 0
                          ? `−${formatScore(section.penalty)}`
                          : '0'}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2.5 font-semibold tabular-nums text-slate-900">
                        {formatScore(section.finalScore)}
                        <span className="ml-1 text-[10px] font-normal text-slate-500">
                          / {formatScore(section.maxMarks)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {paperRows.length > 0 && (
          <section className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Paper performance
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Paper I and Paper II are scored separately. The combined score is
                shown above.
              </p>
            </div>
            <PerformanceTable rows={paperRows} label="Paper" />
          </section>
        )}

        {unitRows.length > 0 && (
          <section className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Unit-wise performance
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Based on the official UGC NET syllabus units delivered in this
                attempt.
              </p>
            </div>
            <PerformanceTable rows={unitRows} label="Official unit" showPaper />
          </section>
        )}

        <section className="border border-slate-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Question review
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Answer keys and explanations are shown after submission.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filters.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setFilter(entry.key)}
                  className={cn(
                    'border px-2.5 py-1 text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-900',
                    filter === entry.key
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500',
                  )}
                >
                  {entry.label}
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {entry.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              No questions match this filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {visible.map((question) => {
                const isOpen = expanded.has(question.id)
                const localizedQuestionText =
                  language === 'hi'
                    ? question.hindi?.questionText ?? question.questionText
                    : question.questionText
                const localizedExplanation =
                  language === 'hi'
                    ? question.hindi?.explanation ?? question.explanation
                    : question.explanation
                return (
                  <article key={question.id}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(question.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            Q{question.number}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-none text-[10px]',
                              outcomeTone(question.outcome),
                            )}
                          >
                            {OUTCOME_LABEL[question.outcome]}
                          </Badge>
                          <span className="text-[11px] text-slate-500">
                            {question.sectionName} ·{' '}
                            {responseTypeLabel(question.responseType)} ·{' '}
                            {question.marks} mark
                            {question.marks === 1 ? '' : 's'}
                          </span>
                          {question.markedForReview && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                              Marked
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-700">
                          {localizedQuestionText}
                        </p>
                        <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                          Your answer:{' '}
                          {responseAnswerText(
                            question,
                            question.response,
                            language,
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={cn(
                            'font-mono text-sm font-bold tabular-nums',
                            scoreTone(question.netMarks),
                          )}
                        >
                          {signedScore(question.netMarks)}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-4">
                        <CbtQuestionBody
                          question={question}
                          language={language}
                        />
                        <CbtAnswerOptions
                          question={question}
                          value={question.response}
                          disabled
                          language={language}
                          review={{
                            correctOptionId: question.correctOptionId,
                            correctOptionIds: question.correctOptionIds,
                            numericAnswer: question.numericAnswer,
                            numericPrecision: question.numericPrecision,
                          }}
                        />

                        <div className="mt-4 grid gap-2 border border-slate-300 bg-white p-3 text-xs sm:grid-cols-2">
                          <div>
                            <div className="font-semibold uppercase tracking-wider text-slate-500">
                              Your answer
                            </div>
                            <div className="mt-1 text-slate-800">
                              {responseAnswerText(
                                question,
                                question.response,
                                language,
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold uppercase tracking-wider text-slate-500">
                              Correct answer
                            </div>
                            <div className="mt-1 text-slate-800">
                              {correctAnswerText(
                                question,
                                {
                                  correctOptionId: question.correctOptionId,
                                  correctOptionIds: question.correctOptionIds,
                                  numericAnswer: question.numericAnswer,
                                },
                                language,
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold uppercase tracking-wider text-slate-500">
                              Marks
                            </div>
                            <div className="mt-1 text-slate-800">
                              {formatScore(question.marksAwarded)} awarded
                              {question.penalty > 0
                                ? ` − ${formatScore(question.penalty)} penalty`
                                : ''}{' '}
                              = {signedScore(question.netMarks)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold uppercase tracking-wider text-slate-500">
                              Time on question
                            </div>
                            <div className="mt-1 text-slate-800">
                              {formatClock(question.timeSpentSec)}
                            </div>
                          </div>
                        </div>

                        {localizedExplanation && (
                          <div className="mt-3 border-l-4 border-slate-400 bg-white px-4 py-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Explanation
                            </div>
                            <div className="mt-1 text-sm text-slate-800">
                              <Markdown content={localizedExplanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 text-[11px] text-slate-500">
          <span>
            {result.profile.name} · profile version {result.profile.version}
          </span>
          <span>Submitted {dateTimeLabel(result.submittedAt)}</span>
        </div>
      </main>
    </div>
  )
}

function ResultStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="border-b border-slate-300 px-4 py-3 sm:border-b-0 sm:border-r last:border-r-0">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

type PerformanceRow = CbtPaperPerformance &
  Partial<
    Pick<CbtUnitPerformance, 'paper' | 'unitCode' | 'unitName' | 'unitOrder'>
  >

function PerformanceTable({
  rows,
  label,
  showPaper = false,
}: {
  rows: PerformanceRow[]
  label: string
  showPaper?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
          <tr>
            {showPaper && (
              <th className="border-b border-slate-300 px-3 py-2 font-semibold">
                Paper
              </th>
            )}
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              {label}
            </th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              Questions
            </th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              Correct
            </th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              Incorrect
            </th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              Unanswered
            </th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              Accuracy
            </th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              Time
            </th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {showPaper && (
                <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                  {row.paper ? `Paper ${row.paper}` : '—'}
                </td>
              )}
              <td className="border-b border-slate-200 px-3 py-2.5">
                <div className="font-medium text-slate-900">{row.name}</div>
                {row.unitCode && (
                  <div className="font-mono text-[10px] text-slate-500">
                    {row.unitCode}
                  </div>
                )}
              </td>
              <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                {row.questionCount}
              </td>
              <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-emerald-800">
                {row.correct}
              </td>
              <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-red-800">
                {row.incorrect}
              </td>
              <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                {row.unanswered}
              </td>
              <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                {formatScore(row.accuracy * 100, 1)}%
              </td>
              <td className="border-b border-slate-200 px-3 py-2.5 tabular-nums text-slate-700">
                {formatDuration(row.timeSpentSec)}
              </td>
              <td className="border-b border-slate-200 px-3 py-2.5 font-semibold tabular-nums text-slate-900">
                {formatScore(row.finalScore)}
                <span className="ml-1 text-[10px] font-normal text-slate-500">
                  / {formatScore(row.maxMarks)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
