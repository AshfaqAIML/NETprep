'use client'

import * as React from 'react'
import { FileText, ArrowLeft, Lightbulb, CheckCircle2, XCircle, Calendar, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { BookmarkButton } from '@/components/shared/bookmark-button'

export function PyqsView() {
  const { viewParams } = useAppStore()
  const [pyqQuestions, setPyqQuestions] = React.useState<any[]>([])
  const [subjects, setSubjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [subjectFilter, setSubjectFilter] = React.useState<string>(viewParams.subject ?? 'all')
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    api.subjects().then((r) => setSubjects(r.subjects))
  }, [])

  React.useEffect(() => {
    setLoading(true)
    const params: any = {}
    if (subjectFilter !== 'all') params.subject = subjectFilter
    api.pyqs(params)
      .then((r) => setPyqQuestions(r.pyqQuestions))
      .finally(() => setLoading(false))
  }, [subjectFilter])

  // Group by year
  const byYear = pyqQuestions.reduce((acc, q) => {
    const y = q.pyqYear ?? 'Unknown'
    if (!acc[y]) acc[y] = []
    acc[y].push(q)
    return acc
  }, {} as Record<string, any[]>)
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-emerald-600 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Previous Year Questions</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Authentic UGC NET questions from previous years. Each PYQ includes a detailed explanation of why the correct answer is right.
        </p>
      </div>

      <div className="mb-5 flex flex-col sm:flex-row gap-2">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="sm:w-[300px]">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground self-center ml-auto">
          {pyqQuestions.length} PYQ{pyqQuestions.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : years.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No PYQs found</p>
          <p className="text-sm text-muted-foreground">Try a different subject filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {years.map((year) => (
            <div key={year}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">{year}</h2>
                <Badge variant="outline" className="text-[10px]">{byYear[year].length} questions</Badge>
              </div>
              <div className="space-y-2">
                {byYear[year].map((q) => {
                  const expanded = expandedIds.has(q.id)
                  return (
                    <Card key={q.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-[10px] capitalize">{q.difficulty}</Badge>
                              {q.source && (
                                <Badge variant="outline" className="text-[10px]">{q.source}</Badge>
                              )}
                              {q.topic?.unit?.subject && (
                                <Badge variant="outline" className="text-[10px]">{q.topic.unit.subject.name}</Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium leading-relaxed">{q.questionText}</div>
                          </div>
                          <BookmarkButton itemType="question" itemId={q.id} showLabel={false} variant="ghost" />
                        </div>

                        <div className="mt-3 space-y-1.5">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const isCorrect = expanded && opt === q.correctAnswer
                            return (
                              <button
                                key={opt}
                                onClick={() => toggleExpand(q.id)}
                                className={cn(
                                  'flex w-full items-start gap-2 rounded-md border px-3 py-1.5 text-left text-xs transition-colors',
                                  isCorrect ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:bg-muted/30',
                                )}
                              >
                                <span className={cn(
                                  'flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-semibold mt-0.5',
                                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground',
                                )}>
                                  {isCorrect ? '✓' : opt}
                                </span>
                                <span className="flex-1">{q[`option${opt}`]}</span>
                              </button>
                            )
                          })}
                        </div>

                        {expanded && (
                          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                              <span className="font-medium text-amber-700 dark:text-amber-300">Explanation</span>
                            </div>
                            <p className="text-muted-foreground">{q.explanation}</p>
                          </div>
                        )}

                        {!expanded && (
                          <button
                            onClick={() => toggleExpand(q.id)}
                            className="mt-2 text-[11px] text-primary hover:underline"
                          >
                            Reveal answer & explanation
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
