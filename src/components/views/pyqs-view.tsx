'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  X,
  BookOpen,
  Layers,
  TrendingUp,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { SourceBadge } from '@/components/shared/source-badge'

export function PyqsView() {
  const { viewParams, navigate } = useAppStore()

  const [questions, setQuestions] = React.useState<any[]>([])
  const [filters, setFilters] = React.useState<any>(null)
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  // Active filters
  const [subject, setSubject] = React.useState<string>(viewParams.subject ?? 'all')
  const [year, setYear] = React.useState<string>('all')
  const [session, setSession] = React.useState<string>('all')
  const [shift, setShift] = React.useState<string>('all')
  const [difficulty, setDifficulty] = React.useState<string>('all')
  const [sourceType, setSourceType] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  // Load stats once
  React.useEffect(() => {
    api.pyqStats().then((s) => setStats(s)).catch(() => {})
  }, [])

  // Load questions when filters change
  React.useEffect(() => {
    setLoading(true)
    const params: any = { limit: 200 }
    if (subject !== 'all') params.subject = subject
    if (year !== 'all') params.year = year
    if (session !== 'all') params.session = session
    if (shift !== 'all') params.shift = shift
    if (difficulty !== 'all') params.difficulty = difficulty
    if (sourceType !== 'all') params.sourceType = sourceType
    if (search.trim()) params.search = search.trim()

    api.pyqs(params)
      .then((r) => {
        setQuestions(r.questions)
        setFilters(r.filters)
      })
      .finally(() => setLoading(false))
  }, [subject, year, session, shift, difficulty, sourceType, search])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setSubject('all')
    setYear('all')
    setSession('all')
    setShift('all')
    setDifficulty('all')
    setSourceType('all')
    setSearch('')
  }

  const activeFilterCount = [subject, year, session, shift, difficulty, sourceType].filter((f) => f !== 'all').length + (search ? 1 : 0)

  // Group by year for display
  const byYear = questions.reduce((acc, q) => {
    const y = q.pyqYear ?? 'Practice'
    if (!acc[y]) acc[y] = []
    acc[y].push(q)
    return acc
  }, {} as Record<string, any[]>)
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-emerald-600 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">UGC NET PYQs</h1>
          {stats?.latestYear && (
            <Badge variant="secondary" className="ml-2 gap-1">
              <Calendar className="h-3 w-3" />
              Latest: {stats.latestYear}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Real questions from official UGC NET examination papers. Every official PYQ is verified against NTA answer keys with full source attribution.
        </p>
      </div>

      {/* Stats banner */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox icon={FileText} label="Official PYQs" value={stats.totalPyqs ?? 0} color="text-emerald-600" />
          <StatBox icon={Layers} label="Exam Papers" value={stats.totalPapers ?? 0} color="text-blue-600" />
          <StatBox icon={Calendar} label="Latest Year" value={stats.latestYear ?? '—'} color="text-violet-600" />
          <StatBox icon={BookOpen} label="Subjects" value={stats.subjectBreakdown?.length ?? 0} color="text-amber-600" />
        </div>
      )}

      {/* Trust banner */}
      <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Source Integrity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Questions labeled <SourceBadge sourceType="official_pyq" /> are verified against official NTA examination papers and answer keys.
              Questions labeled <SourceBadge sourceType="practice" /> are original questions created for additional practice — they are NOT represented as official PYQs.
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filter toggle */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text, keywords, or topics..."
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5 shrink-0"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{activeFilterCount}</Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 shrink-0">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 overflow-hidden"
        >
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <FilterSelect
                  label="Subject"
                  value={subject}
                  onChange={setSubject}
                  options={[
                    { value: 'all', label: 'All subjects' },
                    ...(filters?.subjects ?? []).map((s: any) => ({ value: s.slug, label: s.name })),
                  ]}
                />
                <FilterSelect
                  label="Year"
                  value={year}
                  onChange={setYear}
                  options={[
                    { value: 'all', label: 'All years' },
                    ...(filters?.years ?? []).map((y: number) => ({ value: String(y), label: String(y) })),
                  ]}
                />
                <FilterSelect
                  label="Session"
                  value={session}
                  onChange={setSession}
                  options={[
                    { value: 'all', label: 'All sessions' },
                    ...(filters?.sessions ?? []).map((s: string) => ({ value: s, label: s })),
                  ]}
                />
                <FilterSelect
                  label="Shift"
                  value={shift}
                  onChange={setShift}
                  options={[
                    { value: 'all', label: 'All shifts' },
                    ...(filters?.shifts ?? []).map((s: string) => ({ value: s, label: s })),
                  ]}
                />
                <FilterSelect
                  label="Difficulty"
                  value={difficulty}
                  onChange={setDifficulty}
                  options={[
                    { value: 'all', label: 'All levels' },
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ]}
                />
                <FilterSelect
                  label="Source Type"
                  value={sourceType}
                  onChange={setSourceType}
                  options={[
                    { value: 'all', label: 'Official + Verified PYQs' },
                    { value: 'official_pyq', label: 'Official PYQ only' },
                    { value: 'verified_pyq', label: 'Verified PYQ only' },
                    { value: 'practice', label: 'Practice questions' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results count + practice button */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${questions.length} question${questions.length !== 1 ? 's' : ''} found`}
        </div>
        <Button
          size="sm"
          onClick={() => navigate('practice', { sourceType: sourceType === 'all' ? 'official_pyq' : sourceType, subject, year })}
          disabled={questions.length === 0}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Practice These {questions.length > 0 && `(${Math.min(questions.length, 20)})`}
        </Button>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No questions match your filters</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Try adjusting or clearing your filters.</p>
          <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {years.map((yr) => (
            <div key={yr}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">{yr === 'Practice' ? 'Practice Questions' : `UGC NET ${yr}`}</h2>
                <Badge variant="outline" className="text-[10px]">{byYear[yr].length} questions</Badge>
              </div>
              <div className="space-y-2">
                {byYear[yr].map((q: any) => {
                  const expanded = expandedIds.has(q.id)
                  return (
                    <Card key={q.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Question header */}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                              <SourceBadge sourceType={q.sourceType} />
                              {q.pyqSession && (
                                <Badge variant="secondary" className="text-[9px]">{q.pyqSession} {q.pyqYear}</Badge>
                              )}
                              {q.pyqShift && (
                                <Badge variant="outline" className="text-[9px]">{q.pyqShift}</Badge>
                              )}
                              {q.pyqQuestionNumber && (
                                <Badge variant="outline" className="text-[9px]">Q{q.pyqQuestionNumber}</Badge>
                              )}
                              <Badge variant="outline" className="text-[9px] capitalize">{q.difficulty}</Badge>
                              {q.topic?.unit?.subject && (
                                <button
                                  onClick={() => navigate('subject-detail', { slug: q.topic.unit.subject.slug })}
                                  className="text-[10px] text-muted-foreground hover:text-primary"
                                >
                                  {q.topic.unit.subject.name}
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => toggleExpand(q.id)}
                              className="block w-full text-left"
                            >
                              <div className="text-sm font-medium leading-relaxed">{q.questionText}</div>
                            </button>
                          </div>
                          <BookmarkButton itemType="question" itemId={q.id} showLabel={false} variant="ghost" />
                        </div>

                        {/* Options */}
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

                        {/* Explanation + source */}
                        {expanded && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 space-y-2"
                          >
                            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                                <span className="font-semibold text-amber-700 dark:text-amber-300">Explanation</span>
                              </div>
                              <p className="text-muted-foreground">{q.explanation}</p>
                            </div>
                            {/* Source attribution */}
                            {q.sourceType === 'official_pyq' || q.sourceType === 'verified_pyq' ? (
                              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">Source: {q.source}</span>
                                </div>
                                {q.sourceReference && (
                                  <div className="mt-1 text-muted-foreground">
                                    Reference: <code className="font-mono text-[10px]">{q.sourceReference}</code>
                                  </div>
                                )}
                                {q.pyqExamDate && (
                                  <div className="mt-0.5 text-muted-foreground">Exam date: {q.pyqExamDate}</div>
                                )}
                                {q.sourceUrl && (
                                  <a
                                    href={q.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    Official portal <ArrowRight className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-md border border-violet-500/30 bg-violet-500/5 p-2.5 text-[11px] text-muted-foreground">
                                <strong className="text-violet-700 dark:text-violet-300">{q.source}</strong> — This is an original practice question, not an official PYQ.
                              </div>
                            )}
                          </motion.div>
                        )}

                        {!expanded && (
                          <button
                            onClick={() => toggleExpand(q.id)}
                            className="mt-2 text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            Reveal answer & explanation
                            <ChevronDown className="h-3 w-3" />
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

function StatBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <Icon className={cn('h-4 w-4 mb-1', color)} />
      <div className={cn('text-xl font-bold leading-none', color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
