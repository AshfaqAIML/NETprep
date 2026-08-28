'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Search,
  ArrowRight,
  BookOpen,
  Sparkles,
  FileText,
  FileQuestion,
  Timer,
  Library,
  PenTool,
  TrendingUp,
  Flame,
  Target,
  Clock,
  ChevronRight,
  RotateCcw,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const QUICK_ACCESS = [
  { label: 'Paper I', icon: GraduationCap, view: 'subject-detail' as const, params: { slug: 'paper-1' }, color: 'from-emerald-500 to-teal-600' },
  { label: 'Paper II', icon: Library, view: 'subjects' as const, color: 'from-violet-500 to-purple-600' },
  { label: 'UGC NET PYQs', icon: FileText, view: 'pyqs' as const, color: 'from-lime-500 to-emerald-600', featured: true },
  { label: 'Notes', icon: PenTool, view: 'notes' as const, color: 'from-rose-500 to-pink-600' },
  { label: 'Cheat Sheets', icon: Sparkles, view: 'cheat-sheets' as const, color: 'from-cyan-500 to-blue-500' },
  { label: 'Practice', icon: FileQuestion, view: 'practice' as const, color: 'from-fuchsia-500 to-pink-600' },
  { label: 'Mock Tests', icon: Timer, view: 'mock-tests' as const, color: 'from-orange-500 to-red-600' },
  { label: 'Revision', icon: RotateCcw, view: 'revision' as const, color: 'from-amber-500 to-orange-600' },
]

export function HomeView() {
  const navigate = useAppStore((s) => s.navigate)
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
  const [subjects, setSubjects] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState<any[]>([])
  const [cheatSheets, setCheatSheets] = React.useState<any[]>([])
  const [progress, setProgress] = React.useState<any>(null)
  const [pyqStats, setPyqStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      api.subjects(),
      api.notes({ featured: true, limit: 6 }),
      api.cheatSheets(),
      api.progress().catch(() => null),
      api.pyqStats().catch(() => null),
    ])
      .then(([s, n, c, p, pyqS]) => {
        setSubjects(s.subjects)
        setNotes(n.notes)
        setCheatSheets(c.cheatSheets)
        setProgress(p)
        setPyqStats(pyqS)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[400px] w-[800px] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="mb-4 bg-background/60 backdrop-blur">
              <Sparkles className="h-3 w-3 mr-1 text-primary" />
              Complete UGC NET preparation ecosystem
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Prepare smarter for{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                UGC NET
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground text-balance max-w-2xl">
              Books, notes, cheat sheets, previous-year questions, quizzes, mock tests, study plans and progress tracking — everything you need for your UGC NET preparation in one place.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate('dashboard')} className="gap-2">
                Start Preparing
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('subjects')} className="gap-2">
                <BookOpen className="h-4 w-4" />
                Explore Study Materials
              </Button>
            </div>

            {/* Search bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="mt-8 group flex w-full max-w-xl items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:bg-background transition-colors backdrop-blur"
            >
              <Search className="h-4 w-4" />
              <span>Search books, notes, topics, questions, subjects...</span>
              <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </motion.div>

          {/* Stats row */}
          {progress && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <StatChip icon={Target} label="Completion" value={`${progress.summary.completionPct}%`} accent="text-emerald-600" />
              <StatChip icon={Flame} label="Day Streak" value={`${progress.summary.streak}`} accent="text-amber-600" />
              <StatChip icon={FileQuestion} label="Questions Solved" value={progress.summary.totalAttempts.toLocaleString()} accent="text-violet-600" />
              <StatChip icon={TrendingUp} label="Accuracy" value={`${progress.summary.accuracy}%`} accent="text-rose-600" />
            </motion.div>
          )}
        </div>
      </section>

      {/* Quick Access */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <SectionHeader title="Quick Access" subtitle="Jump straight to what you need" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_ACCESS.map((qa) => {
            const Icon = qa.icon
            const isPyq = qa.label === 'UGC NET PYQs'
            const pyqCount = pyqStats?.totalPyqs
            return (
              <button
                key={qa.label}
                onClick={() => navigate(qa.view, qa.params)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5',
                  isPyq
                    ? 'border-lime-500/40 hover:border-lime-500/60 ring-1 ring-lime-500/20'
                    : 'border-border hover:border-primary/40',
                )}
              >
                {isPyq && pyqCount > 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-lime-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-lime-700 dark:text-lime-300">
                      {pyqCount} PYQs
                    </span>
                  </div>
                )}
                <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', qa.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-3 font-semibold text-sm">{qa.label}</div>
                {isPyq && pyqStats?.latestYear ? (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Real official questions · Latest: {pyqStats.latestYear}
                  </div>
                ) : (
                  <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-0.5">
                    Open <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* PYQ subject breakdown */}
        {pyqStats?.subjectBreakdown && pyqStats.subjectBreakdown.length > 0 && (
          <div className="mt-4 rounded-lg border border-lime-500/20 bg-lime-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-lime-600" />
              <span className="text-sm font-semibold">PYQs available by subject</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pyqStats.subjectBreakdown.map((s: any) => (
                <button
                  key={s.slug}
                  onClick={() => navigate('pyqs', { subject: s.slug })}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:border-lime-500/40 hover:bg-lime-500/5 transition-colors"
                >
                  <span className="font-medium">{s.name}</span>
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">{s.pyqCount}</Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Popular Subjects */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionHeader
          title="Popular Subjects"
          subtitle="Choose your UGC NET Paper II subject"
          action={{ label: 'View all', onClick: () => navigate('subjects') }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)
            : subjects.slice(0, 6).map((s) => (
                <SubjectCard key={s.id} subject={s} onClick={() => navigate('subject-detail', { slug: s.slug })} />
              ))}
        </div>
      </section>

      {/* Featured notes */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <SectionHeader
          title="Study Resources"
          subtitle="Featured notes and cheat sheets curated for serious aspirants"
          action={{ label: 'Browse all notes', onClick: () => navigate('notes') }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
            : notes.slice(0, 6).map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onClick={() => navigate('note-reader', { slug: n.slug })}
                />
              ))}
        </div>
      </section>

      {/* Your Preparation block */}
      {progress && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <SectionHeader
            title="Your Preparation"
            subtitle="A snapshot of your current progress"
            action={{ label: 'Open dashboard', onClick: () => navigate('dashboard') }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Subject Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress.subjectProgress.slice(0, 4).map((sp: any) => (
                  <div key={sp.subjectId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{sp.subjectName}</span>
                      <span className="text-muted-foreground">{sp.completed}/{sp.total} topics · {sp.percentage}%</span>
                    </div>
                    <Progress value={sp.percentage} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <StatBox label="Accuracy" value={`${progress.summary.accuracy}%`} icon={Target} />
                <StatBox label="Mock Tests" value={progress.summary.mockAttempts} icon={Timer} />
                <StatBox label="Study Hours" value={progress.summary.totalStudyHours} icon={Clock} />
                <StatBox label="Streak" value={`${progress.summary.streak}d`} icon={Flame} />
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick} className="gap-1 text-muted-foreground">
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

function StatChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn('h-3.5 w-3.5', accent)} />
        {label}
      </div>
      <div className={cn('mt-1 text-xl font-bold', accent)}>{value}</div>
    </div>
  )
}

function SubjectCard({ subject, onClick }: { subject: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/40"
    >
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', subject.color ?? 'from-emerald-500 to-teal-600')} />
      <div className="flex items-start justify-between">
        <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', subject.color ?? 'from-emerald-500 to-teal-600')}>
          <Library className="h-5 w-5" />
        </div>
        <Badge variant="outline" className="text-[10px]">Code {subject.code}</Badge>
      </div>
      <h3 className="mt-3 font-semibold leading-tight">{subject.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{subject.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{subject._count?.units ?? 0} units</span>
        <span className="inline-flex items-center gap-1"><PenTool className="h-3 w-3" />{subject._count?.notes ?? 0} notes</span>
        <span className="inline-flex items-center gap-1"><FileQuestion className="h-3 w-3" />{subject._count?.questions ?? 0} Qs</span>
      </div>
    </button>
  )
}

function NoteCard({ note, onClick }: { note: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        {note.subject && (
          <Badge variant="secondary" className="text-[10px]">{note.subject.name}</Badge>
        )}
        <Badge variant="outline" className="text-[10px]">{note.difficulty}</Badge>
      </div>
      <h3 className="mt-3 font-semibold leading-tight line-clamp-2">{note.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{note.excerpt}</p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{note.readingTime} min read</span>
        <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{note.views ?? 0} views</span>
      </div>
    </button>
  )
}

function StatBox({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="mt-1 text-lg font-bold leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  )
}
