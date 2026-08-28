'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Library,
  PenTool,
  Sparkles,
  BookOpen,
  FileQuestion,
  FileText,
  Timer,
  Circle,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'not-started': { label: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
  'studying': { label: 'Studying', icon: CircleDot, color: 'text-amber-500' },
  'completed': { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
  'needs-revision': { label: 'Needs Revision', icon: AlertCircle, color: 'text-rose-500' },
}

export function SubjectDetailView() {
  const { viewParams, navigate } = useAppStore()
  const slug = viewParams.slug as string
  const [subject, setSubject] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.subject(slug)
      .then((r) => setSubject(r.subject))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!subject) {
    return <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">Subject not found.</div>
  }

  // overall progress
  const allTopics = subject.units.flatMap((u: any) => u.topics)
  const completed = allTopics.filter((t: any) => t.progress?.status === 'completed').length
  const completionPct = allTopics.length > 0 ? Math.round((completed / allTopics.length) * 100) : 0

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('subjects')} className="mb-4 gap-1 text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Subjects
      </Button>

      {/* Header */}
      <div className={cn('relative overflow-hidden rounded-2xl border border-border p-6 mb-6 bg-gradient-to-br', subject.color ?? 'from-emerald-500 to-teal-600')}>
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur text-white">
            <Library className="h-7 w-7" />
          </div>
          <div className="text-white flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">Code {subject.code}</Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">Paper {subject.paper}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{subject.name}</h1>
            <p className="mt-1 text-sm text-white/85 max-w-2xl">{subject.description}</p>
          </div>
          <div className="text-white">
            <div className="text-3xl font-bold">{completionPct}%</div>
            <div className="text-xs text-white/85">Completed</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content - Units */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Syllabus Units</h2>
            <Badge variant="outline">{subject.units.length} units · {allTopics.length} topics</Badge>
          </div>

          <Accordion type="multiple" defaultValue={[subject.units[0]?.id]} className="space-y-3">
            {subject.units.map((unit: any) => {
              const unitTopics = unit.topics
              const unitCompleted = unitTopics.filter((t: any) => t.progress?.status === 'completed').length
              const unitPct = unitTopics.length > 0 ? Math.round((unitCompleted / unitTopics.length) * 100) : 0

              return (
                <AccordionItem key={unit.id} value={unit.id} className="border border-border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
                    <div className="flex items-center gap-3 flex-1 pr-3 text-left">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm">
                        {unit.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{unit.name}</div>
                        <div className="text-xs text-muted-foreground">{unitTopics.length} topics · {unitPct}% complete</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-3">{unit.description}</p>
                    <Progress value={unitPct} className="h-1.5 mb-3" />
                    <div className="space-y-1.5">
                      {unitTopics.map((t: any) => {
                        const status = t.progress?.status ?? 'not-started'
                        const meta = STATUS_META[status]
                        const Icon = meta.icon
                        return (
                          <button
                            key={t.id}
                            onClick={() => navigate('topic-detail', { topicId: t.id, subjectSlug: subject.slug })}
                            className="group flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-muted/30 transition-colors"
                          >
                            <Icon className={cn('h-4 w-4 shrink-0', meta.color)} />
                            <span className="flex-1 font-medium">{t.name}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">{t.importance}</Badge>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <StatRow icon={BookOpen} label="Units" value={subject.units.length} />
              <StatRow icon={FileText} label="Topics" value={allTopics.length} />
              <StatRow icon={PenTool} label="Notes" value={subject.notes.length} />
              <StatRow icon={Sparkles} label="Cheat Sheets" value={subject.cheatsheets.length} />
              <StatRow icon={BookOpen} label="Books" value={subject.books.length} />
              <StatRow icon={CheckCircle2} label="Completed" value={`${completed}/${allTopics.length}`} accent="text-emerald-600" />
            </CardContent>
          </Card>

          {subject.books.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Books</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {subject.books.slice(0, 4).map((b: any) => (
                  <button
                    key={b.id}
                    onClick={() => navigate('books', { highlightSlug: b.slug })}
                    className="block w-full text-left rounded-md border border-border p-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-medium text-sm line-clamp-1">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{b.author} · ⭐ {b.rating}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {subject.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {subject.notes.slice(0, 4).map((n: any) => (
                  <button
                    key={n.id}
                    onClick={() => navigate('note-reader', { slug: n.slug })}
                    className="block w-full text-left rounded-md border border-border p-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-medium text-sm line-clamp-1">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.readingTime} min read</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Start Practicing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" className="w-full justify-start gap-2" onClick={() => navigate('practice', { subject: subject.slug })}>
                <FileQuestion className="h-3.5 w-3.5" /> MCQ Practice
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('pyqs', { subject: subject.slug })}>
                <FileText className="h-3.5 w-3.5" /> Previous Year Questions
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('mock-tests', { subject: subject.slug })}>
                <Timer className="h-3.5 w-3.5" /> Mock Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatRow({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={cn('font-semibold', accent)}>{value}</span>
    </div>
  )
}
