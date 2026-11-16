'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Calculator,
  CheckCircle2,
  Clock,
  FileQuestion,
  Info,
  Languages,
  ListChecks,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  storeCbtRoute,
  writeExamHash,
} from '@/lib/cbt/client'
import { formatClock, formatDuration } from '@/lib/cbt/status'
import type {
  CbtContentRequirement,
  CbtProfileDetailResponse,
  CbtProfileSummary,
} from '@/lib/cbt/types'
import type {
  NegativeMarkingRule,
  QuestionPresentationType,
  ResponseType,
} from '@/lib/exam/types'

const RESPONSE_LABELS: Record<ResponseType, string> = {
  single: 'MCQ',
  multiple: 'MSQ',
  numeric: 'NAT',
}

const PRESENTATION_LABELS: Record<QuestionPresentationType, string> = {
  text: 'Text',
  passage: 'Passage',
  table: 'Table',
  diagram: 'Diagram',
  code: 'Code',
  mathematical: 'Mathematical',
  'data-interpretation': 'Data interpretation',
}

function penaltyText(rule: NegativeMarkingRule): string {
  if (rule.mode === 'fraction-of-question-marks') {
    return `−${rule.fraction.numerator}/${rule.fraction.denominator} of the question marks`
  }
  return 'No negative marking'
}

function markingRows(profile: CbtProfileSummary): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Correct answer', value: 'Full question marks' },
  ]

  if (profile.questionTypes.includes('single')) {
    rows.push({
      label: 'Incorrect MCQ',
      value: penaltyText(profile.marking.incorrect.single),
    })
  }
  if (profile.questionTypes.includes('multiple')) {
    rows.push({
      label: 'Incorrect or incomplete MSQ',
      value: 'No marks; exact correct combination required, no partial marking',
    })
  }
  if (profile.questionTypes.includes('numeric')) {
    rows.push({
      label: 'Incorrect NAT',
      value: 'No negative marking',
    })
    rows.push({
      label: 'NAT evaluation',
      value: `${profile.marking.numeric.precision} decimal place${
        profile.marking.numeric.precision === 1 ? '' : 's'
      }${profile.marking.numeric.defaultTolerance > 0 ? ' with tolerance' : ''}`,
    })
  }
  rows.push({ label: 'Unanswered question', value: 'No marks awarded or deducted' })

  return rows
}

function RequirementBar({ requirement }: { requirement: CbtContentRequirement }) {
  const percent =
    requirement.required > 0
      ? Math.min(100, (requirement.available / requirement.required) * 100)
      : 0
  const complete = requirement.available >= requirement.required

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-slate-700">{requirement.label}</span>
        <span
          className={cn(
            'shrink-0 font-semibold tabular-nums',
            complete ? 'text-emerald-700' : 'text-slate-600',
          )}
        >
          {requirement.available}/{requirement.required}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full bg-slate-200">
        <div
          className={cn('h-full', complete ? 'bg-emerald-700' : 'bg-slate-600')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function SectionTable({ profile }: { profile: CbtProfileSummary }) {
  return (
    <div className="overflow-x-auto border border-slate-300">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
          <tr>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">Section</th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">Questions</th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">Marks</th>
            <th className="border-b border-slate-300 px-3 py-2 font-semibold">Formats</th>
          </tr>
        </thead>
        <tbody>
          {profile.sections.map((section) => (
            <tr key={section.id} className="align-top">
              <td className="border-b border-slate-200 px-3 py-3">
                <div className="font-medium text-slate-900">{section.name}</div>
                {section.parentNames.length > 0 && (
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {section.parentNames.join(' › ')}
                  </div>
                )}
              </td>
              <td className="border-b border-slate-200 px-3 py-3 tabular-nums text-slate-700">
                {section.questionCount ?? 'As per pattern'}
              </td>
              <td className="border-b border-slate-200 px-3 py-3 tabular-nums text-slate-700">
                {section.marks}
              </td>
              <td className="border-b border-slate-200 px-3 py-3 text-slate-700">
                {section.questionTypes.map((type) => RESPONSE_LABELS[type]).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ExamInstructionsView() {
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)
  const profileCode = typeof viewParams.profileCode === 'string' ? viewParams.profileCode : ''

  const [detail, setDetail] = React.useState<CbtProfileDetailResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [acknowledged, setAcknowledged] = React.useState(false)
  const [starting, setStarting] = React.useState(false)
  const [startError, setStartError] = React.useState<string | null>(null)

  const load = React.useCallback(() => {
    if (!profileCode) {
      setLoadError('No examination was selected.')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    api
      .examProfile(profileCode)
      .then((response) => {
        setDetail(response)
        writeExamHash({
          kind: 'instructions',
          id: response.profile.code,
          profileCode: response.profile.code,
        })
        storeCbtRoute({
          kind: 'instructions',
          id: response.profile.code,
          profileCode: response.profile.code,
        })
      })
      .catch((error: unknown) => {
        setLoadError(
          error instanceof Error ? error.message : 'The examination could not be loaded.',
        )
      })
      .finally(() => setLoading(false))
  }, [profileCode])

  React.useEffect(() => {
    load()
  }, [load])

  const goBack = React.useCallback(() => {
    navigate('mock-tests')
  }, [navigate])

  const start = React.useCallback(async () => {
    if (!detail || starting || !detail.availability.available) return
    setStarting(true)
    setStartError(null)
    try {
      const payload = await api.startExam(detail.profile.code)
      const route = {
        kind: 'runner' as const,
        id: payload.attempt.id,
        profileCode: detail.profile.code,
      }
      writeExamHash(route)
      storeCbtRoute(route)
      navigate('exam-runner', { attemptId: payload.attempt.id })
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : 'The examination could not be started.',
      )
      setStarting(false)
    }
  }, [detail, navigate, starting])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  if (loadError || !detail) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-3xl border border-slate-300 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Examination unavailable
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {loadError ?? 'The examination could not be loaded.'}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Mock Tests
            </Button>
            <Button size="sm" onClick={load}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { profile, availability, candidate, activeAttempt } = detail
  const canStart = availability.available
  const canProceed = canStart && (activeAttempt !== null || acknowledged)
  const marking = markingRows(profile)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">NETPrep Examination Centre</div>
              <div className="text-[11px] text-slate-600">
                Computer-based test · Instructions
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Mock Tests
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="border border-slate-300 bg-white">
          <div className="border-b border-slate-700 bg-slate-900 px-5 py-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/30 bg-white/10 text-white">
                {profile.authority === 'NTA' ? 'NTA · UGC NET' : 'IIT Madras · GATE'}
              </Badge>
              <Badge className="border-white/30 bg-white/10 text-white">
                {profile.examYear}
                {profile.session ? ` · ${profile.session}` : ''}
              </Badge>
              {profile.derivedPractice && (
                <Badge className="border-white/30 bg-white/10 text-white">
                  Derived practice profile
                </Badge>
              )}
              {profile.officialPattern && (
                <Badge className="border-white/30 bg-white/10 text-white">
                  Official pattern
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">
              {profile.name}
            </h1>
            {profile.subjectName && (
              <p className="mt-1 text-sm text-slate-300">{profile.subjectName}</p>
            )}
          </div>

          <div className="grid gap-0 border-b border-slate-300 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCell
              icon={Clock}
              label="Duration"
              value={formatDuration(profile.durationMinutes * 60)}
            />
            <InfoCell
              icon={FileQuestion}
              label="Questions"
              value={String(profile.totalQuestions)}
            />
            <InfoCell icon={Award} label="Maximum marks" value={String(profile.totalMarks)} />
            <InfoCell
              icon={ListChecks}
              label="Question formats"
              value={profile.questionTypes.map((type) => RESPONSE_LABELS[type]).join(', ')}
            />
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-7">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Candidate
                </h2>
                <div className="mt-3 grid gap-3 border border-slate-300 bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Candidate name
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {candidate.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Candidate ID
                    </div>
                    <div className="mt-1 font-mono text-sm text-slate-900">
                      {candidate.id}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Paper pattern
                </h2>
                <div className="mt-3">
                  <SectionTable profile={profile} />
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  All sections share one continuous timer. The timer does not pause
                  when you move between sections.
                </p>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Marking scheme
                </h2>
                <div className="mt-3 overflow-hidden border border-slate-300">
                  <table className="w-full border-collapse text-left text-sm">
                    <tbody>
                      {marking.map((row) => (
                        <tr key={row.label}>
                          <th className="w-1/2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 font-medium text-slate-700">
                            {row.label}
                          </th>
                          <td className="border-b border-slate-200 px-3 py-2.5 text-slate-700">
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Examination instructions
                </h2>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  {profile.instructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                </ol>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Navigation and submission
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
                    You may move backward and forward between questions and sections.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
                    Answers may be changed until you submit the examination.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
                    Use Mark for Review to flag a question; marking does not affect
                    scoring.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
                    Your answers are saved automatically while you work.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
                    When the timer reaches zero, the examination is submitted
                    automatically.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
                    After submission, answers are final and cannot be changed.
                  </li>
                </ul>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <div className="border border-slate-300 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <Languages className="h-3.5 w-3.5" />
                    Language
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">
                    {profile.language.bilingual
                      ? 'English and Hindi'
                      : 'English only'}
                  </p>
                  {profile.language.note && (
                    <p className="mt-1 text-xs text-slate-500">{profile.language.note}</p>
                  )}
                </div>
                <div className="border border-slate-300 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <Calculator className="h-3.5 w-3.5" />
                    Calculator
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">
                    {profile.navigation.calculator === 'virtual'
                      ? 'On-screen calculator permitted'
                      : 'Not permitted'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Question and option order: {profile.navigation.questionOrder}.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Presentation formats
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.presentationTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="border-slate-400 text-slate-700"
                    >
                      {PRESENTATION_LABELS[type]}
                    </Badge>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              {!availability.available && (
                <div className="border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    Content in preparation
                  </div>
                  <p className="mt-2 text-xs leading-5 text-amber-900">
                    {availability.note ??
                      'This examination cannot be assembled from the available question bank yet.'}
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {availability.requirements.map((requirement) => (
                      <RequirementBar
                        key={requirement.label}
                        requirement={requirement}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeAttempt && (
                <div className="border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <RotateCcw className="h-4 w-4" />
                    Attempt in progress
                  </div>
                  <p className="mt-2 text-xs leading-5 text-amber-900">
                    An examination attempt is already open for this profile. The
                    server timer continues to run.
                  </p>
                  <div className="mt-3 flex items-baseline justify-between border-t border-amber-300 pt-2 text-xs text-amber-900">
                    <span>Time remaining</span>
                    <span className="font-mono text-base font-semibold">
                      {formatClock(activeAttempt.remainingSec)}
                    </span>
                  </div>
                </div>
              )}

              <div className="border border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Info className="h-4 w-4" />
                  Before you begin
                </div>
                <ul className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
                  <li>Keep this window open for the full duration.</li>
                  <li>Do not refresh or close the window during the examination.</li>
                  <li>Your progress is stored on the server.</li>
                  <li>Use the question palette to move quickly between questions.</li>
                </ul>
              </div>
            </aside>
          </div>

          <div className="border-t border-slate-300 bg-slate-50 px-5 py-4">
            {startError && (
              <div className="mb-3 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {startError}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="cbt-acknowledgement"
                  checked={acknowledged}
                  disabled={!canStart}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  className="mt-0.5 border-slate-500 data-[state=checked]:border-slate-900 data-[state=checked]:bg-slate-900"
                />
                <label
                  htmlFor="cbt-acknowledgement"
                  className={cn(
                    'max-w-2xl text-xs leading-5 text-slate-700',
                    !canStart && 'text-slate-500',
                  )}
                >
                  I have read and understood the instructions. I understand that the
                  examination is timed, that my answers are final after submission,
                  and that the examination will be submitted automatically when the
                  timer expires.
                </label>
              </div>
              <Button
                size="lg"
                onClick={start}
                disabled={!canProceed || starting}
                className="shrink-0 gap-2 bg-slate-900 text-white hover:bg-slate-800"
              >
                {starting ? (
                  'Starting…'
                ) : activeAttempt ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Resume examination
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Proceed to examination
                  </>
                )}
              </Button>
            </div>
            {!availability.available && (
              <p className="mt-2 text-right text-[11px] text-slate-500">
                The start control is disabled until the required content is available.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="border-b border-slate-300 px-4 py-3 sm:border-r last:border-r-0 lg:border-b-0">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}
