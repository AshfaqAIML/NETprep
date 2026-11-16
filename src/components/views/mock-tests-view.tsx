'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileQuestion,
  RotateCcw,
  ShieldCheck,
  Timer,
  Trophy,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'
import { storeCbtRoute, writeExamHash } from '@/lib/cbt/client'
import { formatClock, formatDuration } from '@/lib/cbt/status'
import type {
  CbtAvailability,
  CbtCatalogueEntry,
  CbtCatalogueResponse,
  CbtProfileSummary,
} from '@/lib/cbt/types'

function familyLabel(profile: CbtProfileSummary): string {
  return profile.family === 'GATE' ? 'GATE' : 'UGC NET'
}

function responseTypeLabel(type: 'single' | 'multiple' | 'numeric'): string {
  if (type === 'multiple') return 'MSQ'
  if (type === 'numeric') return 'NAT'
  return 'MCQ'
}

function markingSummary(profile: CbtProfileSummary): string {
  const parts: string[] = []
  const single = profile.marking.incorrect.single
  if (single.mode === 'fraction-of-question-marks') {
    parts.push(
      `MCQ −${single.fraction.numerator}/${single.fraction.denominator} of question marks`,
    )
  } else {
    parts.push('No negative marking')
  }
  if (profile.questionTypes.includes('multiple')) {
    parts.push('MSQ exact match only')
  }
  if (profile.questionTypes.includes('numeric')) {
    parts.push('NAT no penalty')
  }
  return parts.join(' · ')
}

function timeLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function RequirementBar({ requirement }: { requirement: CbtAvailability['requirements'][number] }) {
  const percent =
    requirement.required > 0
      ? Math.min(100, (requirement.available / requirement.required) * 100)
      : 0
  const complete = requirement.available >= requirement.required
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[11px]">
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
      <div className="mt-1 h-1.5 w-full bg-slate-200">
        <div
          className={cn('h-full', complete ? 'bg-emerald-700' : 'bg-slate-600')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function CbtExamCard({
  entry,
  onStart,
  onResume,
}: {
  entry: CbtCatalogueEntry
  onStart: (profileCode: string) => void
  onResume: (attemptId: string) => void
}) {
  const { profile, activeAttempt } = entry
  const sectionPreview = profile.sections.slice(0, 4)
  const extraSections = profile.sections.length - sectionPreview.length

  return (
    <article className="flex flex-col border border-slate-300 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="rounded-none border-slate-500 text-[10px] font-semibold text-slate-800"
            >
              {familyLabel(profile)}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-none border-slate-400 text-[10px] text-slate-600"
            >
              {profile.authority === 'NTA' ? 'NTA' : 'IIT Madras'}
            </Badge>
            {profile.officialPattern && (
              <Badge
                variant="outline"
                className="rounded-none border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800"
              >
                Official pattern
              </Badge>
            )}
            {profile.derivedPractice && (
              <Badge
                variant="outline"
                className="rounded-none border-amber-300 bg-amber-50 text-[10px] text-amber-900"
              >
                Derived practice
              </Badge>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold leading-tight text-slate-900">
            {profile.shortName}
          </h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">{profile.name}</p>
          {profile.subjectName && (
            <p className="mt-0.5 text-[11px] text-slate-500">{profile.subjectName}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-sm font-bold tabular-nums text-slate-900">
            {profile.totalQuestions} Q · {profile.totalMarks} marks
          </div>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            {formatDuration(profile.durationMinutes * 60)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
            {profile.examYear}
            {profile.session ? ` · ${profile.session}` : ''}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
        <div className="px-3 py-2">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Sections
          </div>
          <div className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
            {profile.sections.length}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Formats
          </div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {profile.questionTypes.map(responseTypeLabel).join(' / ')}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Marking
          </div>
          <div className="mt-0.5 truncate text-[11px] font-medium text-slate-800">
            {profile.marking.incorrect.single.mode === 'none'
              ? 'No negative'
              : 'Negative for MCQ'}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {sectionPreview.map((section) => (
            <span
              key={section.id}
              className="border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-700"
            >
              <span className="font-semibold">{section.code}</span>
              {' · '}
              {section.questionCount ?? 'pattern'}
              {section.questionCount ? ' Q' : ''}
              {' · '}
              {section.marks} marks
            </span>
          ))}
          {extraSections > 0 && (
            <span className="border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
              +{extraSections} more
            </span>
          )}
        </div>
        <p className="text-[11px] leading-5 text-slate-600">
          {markingSummary(profile)}
        </p>
        {profile.language.bilingual && (
          <p className="text-[11px] text-slate-500">
            Bilingual paper: English and Hindi. Paper II subject content is
            English-only where specified.
          </p>
        )}
      </div>

      {activeAttempt ? (
        <div className="border-t border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <RotateCcw className="h-3.5 w-3.5" />
                Attempt in progress
              </div>
              <div className="mt-0.5 text-[11px] text-amber-900">
                Started {timeLabel(activeAttempt.startedAt)} · Time remaining{' '}
                <span className="font-mono font-semibold">
                  {formatClock(activeAttempt.remainingSec)}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onResume(activeAttempt.id)}
              className="gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
            >
              Resume examination
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-300 px-4 py-3">
          <Button
            onClick={() => onStart(profile.code)}
            className="w-full gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
          >
            View instructions &amp; start
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </article>
  )
}

function UpcomingCard({
  profile,
  availability,
}: {
  profile: CbtProfileSummary
  availability: CbtAvailability
}) {
  return (
    <article className="border border-dashed border-slate-300 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className="rounded-none border-slate-400 text-[10px] text-slate-600"
          >
            {familyLabel(profile)}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-none border-amber-300 bg-amber-50 text-[10px] text-amber-900"
          >
            Content in preparation
          </Badge>
        </div>
        <h3 className="mt-2 text-base font-semibold leading-tight text-slate-900">
          {profile.shortName}
        </h3>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">{profile.name}</p>
      </div>
      <div className="space-y-2.5 px-4 py-3">
        {availability.requirements.map((requirement) => (
          <RequirementBar key={requirement.label} requirement={requirement} />
        ))}
        {availability.note && (
          <p className="border-t border-slate-200 pt-2 text-[11px] leading-5 text-slate-600">
            {availability.note}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          The start control appears only when the paper can be assembled.
        </div>
      </div>
    </article>
  )
}

export function MockTestsView() {
  const navigate = useAppStore((s) => s.navigate)
  const [mockTests, setMockTests] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  const [catalogue, setCatalogue] = React.useState<CbtCatalogueResponse | null>(null)
  const [cbtLoading, setCbtLoading] = React.useState(true)
  const [cbtError, setCbtError] = React.useState<string | null>(null)
  const [catalogueKey, setCatalogueKey] = React.useState(0)

  React.useEffect(() => {
    api.mockTests()
      .then((r) => setMockTests(r.mockTests))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    let cancelled = false
    setCbtLoading(true)
    setCbtError(null)
    api.exams()
      .then((response) => {
        if (!cancelled) setCatalogue(response)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setCbtError(
          loadError instanceof Error
            ? loadError.message
            : 'The examination catalogue could not be loaded.',
        )
      })
      .finally(() => {
        if (!cancelled) setCbtLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [catalogueKey])

  const openInstructions = React.useCallback(
    (profileCode: string) => {
      const route = {
        kind: 'instructions' as const,
        id: profileCode,
        profileCode,
      }
      writeExamHash(route)
      storeCbtRoute(route)
      navigate('exam-instructions', { profileCode })
    },
    [navigate],
  )

  const resumeAttempt = React.useCallback(
    (attemptId: string) => {
      const route = { kind: 'runner' as const, id: attemptId }
      writeExamHash(route)
      storeCbtRoute(route)
      navigate('exam-runner', { attemptId })
    },
    [navigate],
  )

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => navigate('home') },
        { label: 'Mock Tests' },
      ]} />
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <Timer className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Full-length computer-based examinations with server-timed sessions,
          question palettes, section navigation and detailed post-exam review.
          Sectional practice mocks remain available below.
        </p>
      </div>

      <section aria-labelledby="cbt-catalogue-heading" className="mb-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              <h2
                id="cbt-catalogue-heading"
                className="text-xl font-semibold tracking-tight text-slate-900"
              >
                Full-length CBT examinations
              </h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Official-pattern papers assembled from the verified question bank.
              Each session runs on a server-authoritative timer and resumes after
              a refresh.
            </p>
          </div>
          {catalogue && (
            <div className="text-[11px] text-slate-500">
              Candidate{' '}
              <span className="font-medium text-slate-800">
                {catalogue.candidate.name}
              </span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span className="font-mono">{catalogue.candidate.id}</span>
            </div>
          )}
        </div>

        {cbtLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : cbtError ? (
          <div className="border border-red-300 bg-red-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-900">
                  Examination catalogue unavailable
                </div>
                <p className="mt-1 text-xs leading-5 text-red-800">{cbtError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCatalogueKey((value) => value + 1)}
                  className="mt-3 gap-1.5 rounded-none border-red-300 bg-white text-red-800 hover:bg-red-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        ) : catalogue ? (
          <>
            {catalogue.entries.length === 0 ? (
              <div className="border border-slate-300 bg-white px-4 py-8 text-center">
                <FileQuestion className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-800">
                  No full-length examination is ready yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Papers appear here as soon as the required verified content is
                  available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {catalogue.entries.map((entry) => (
                  <CbtExamCard
                    key={entry.profile.code}
                    entry={entry}
                    onStart={openInstructions}
                    onResume={resumeAttempt}
                  />
                ))}
              </div>
            )}

            {catalogue.upcoming.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                    Upcoming examinations
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {catalogue.upcoming.map((entry) => (
                    <UpcomingCard
                      key={entry.profile.code}
                      profile={entry.profile}
                      availability={entry.availability}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </section>

      <section aria-labelledby="sectional-mocks-heading">
        <div className="mb-4 border-t border-slate-300 pt-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-slate-600" />
            <h2
              id="sectional-mocks-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Sectional practice tests
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Shorter topic-level mocks for focused practice. These use the
            existing practice-test flow.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-44 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mockTests.map((mt) => (
              <Card
                key={mt.id}
                className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-red-600" />
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                      <Timer className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        Paper {mt.paper}
                      </Badge>
                      {mt.subject && (
                        <Badge variant="outline" className="text-[10px]">
                          {mt.subject.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold leading-tight">{mt.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {mt.description}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border border-border bg-muted/30 py-2">
                      <div className="text-sm font-bold">
                        {mt._count?.questions ?? 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Questions
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 py-2">
                      <div className="text-sm font-bold">{mt.durationMin}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Minutes
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 py-2">
                      <div className="text-sm font-bold">{mt.totalMarks}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Marks
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('mock-test-runner', { slug: mt.slug })}
                    className="mt-4 w-full gap-1.5"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    Start Test
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && mockTests.length === 0 && (
          <div className="py-16 text-center">
            <Timer className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No sectional mock tests yet</p>
            <p className="text-sm text-muted-foreground">
              Sectional practice tests will appear here once published.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-700">
            Sectional mock tests could not be loaded.
          </p>
        )}
      </section>
    </div>
  )
}
