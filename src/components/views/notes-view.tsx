'use client'

import * as React from 'react'
import { PenTool, Search, Clock, FileText, ArrowLeft, Filter, GraduationCap, Cpu, Layers, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  hard: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

const BOOK_NOTE_RE = /^ugc-net-paper-(\d+)-part-(\d+)$/
const SHORT_BOOK_NOTE_RE = /^ugc-net-paper-(\d+)-short-part-(\d+)$/

export function NotesView() {
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)
  const [notes, setNotes] = React.useState<any[]>([])
  const [subjects, setSubjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [subjectFilter, setSubjectFilter] = React.useState<string>('all')
  const [paper, setPaper] = React.useState<number | null>(viewParams.paper === 'I' ? 1 : viewParams.paper === 'II' ? 2 : null)
  // 'long' = full book notes (Quick Access Paper I / Paper II), 'short' = condensed notes (Quick Access Notes)
  const [kind] = React.useState<'long' | 'short'>(viewParams.kind === 'long' ? 'long' : 'short')

  React.useEffect(() => {
    Promise.all([api.notes({ limit: 100 }), api.subjects()])
      .then(([n, s]) => {
        setNotes(n.notes)
        setSubjects(s.subjects)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Book (hierarchical book-note) notes vs. regular notes.
  // Long (full) books live at Quick Access Paper I / Paper II; short (condensed)
  // books live at Quick Access Notes. `kind` selects which set drives the
  // Paper → Part navigation below.
  const sortByPart = (re: RegExp) => (a: any, b: any) =>
    parseInt(a.slug.match(re)[a.slug.match(re).length - 1]) - parseInt(b.slug.match(re)[b.slug.match(re).length - 1])
  const longBookNotes = React.useMemo(
    () => notes.filter((n) => BOOK_NOTE_RE.test(n.slug)).sort(sortByPart(BOOK_NOTE_RE)),
    [notes],
  )
  const shortBookNotes = React.useMemo(
    () => notes.filter((n) => SHORT_BOOK_NOTE_RE.test(n.slug)).sort(sortByPart(SHORT_BOOK_NOTE_RE)),
    [notes],
  )
  const activeBookNotes = kind === 'long' ? longBookNotes : shortBookNotes
  const activeBookRe = kind === 'long' ? BOOK_NOTE_RE : SHORT_BOOK_NOTE_RE
  const otherNotes = React.useMemo(
    () => notes.filter((n) => !BOOK_NOTE_RE.test(n.slug) && !SHORT_BOOK_NOTE_RE.test(n.slug) && !(n.content ?? '').includes('## UNIT')),
    [notes],
  )

  const papersConfig = React.useMemo(() => {
    const papers: Record<number, any[]> = { 1: [], 2: [] }
    for (const n of activeBookNotes) {
      const m = n.slug.match(activeBookRe)
      if (!m) continue
      papers[parseInt(m[1])].push({ part: parseInt(m[m.length - 1]), slug: n.slug, title: n.title, excerpt: n.excerpt })
    }
    return papers
  }, [activeBookNotes, activeBookRe])

  const filtered = otherNotes.filter((n) => {
    const matchesQuery =
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      (n.tags ?? '').toLowerCase().includes(query.toLowerCase())
    const matchesSubject = subjectFilter === 'all' || n.subjectId === subjectFilter
    return matchesQuery && matchesSubject
  })

  const openPart = (slug: string, paperNum: number, partNum: number) =>
    navigate('note-reader', { slug, paper: paperNum === 1 ? 'I' : 'II', part: partNum })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {viewParams.subjectId && (
        <Button variant="ghost" size="sm" onClick={() => navigate('subjects')} className="mb-4 gap-1 text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Subjects
        </Button>
      )}

      <Breadcrumbs items={[
        { label: 'Home', onClick: () => navigate('home') },
        { label: 'Notes Library' },
      ]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{kind === 'long' ? 'Long Notes' : 'Notes Library'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {kind === 'long'
            ? 'Full book-length notes for UGC NET Paper I and Paper II. Pick a part, then drill into units, chapters and content.'
            : 'Condensed, exam-ready short notes for UGC NET Paper I and Paper II. Each note is syllabus-mapped and includes explanations, examples, and revision summaries.'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <>
          {/* ── Book navigation: Paper → Part → (reader) Units → Chapters → Content ── */}
          <div className="mb-8 rounded-2xl border border-border/60 bg-muted/30 p-5">
            {paper === null ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">UGC NET Books · {kind === 'long' ? 'Long Notes' : 'Short Notes'}</h2>
                  <p className="text-xs text-muted-foreground">Select a paper, then a part, then drill into units, chapters and content.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card onClick={() => setPaper(1)} className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white mb-3"><GraduationCap className="h-6 w-6" /></div>
                      <h3 className="font-bold">Paper I</h3>
                      <p className="text-xs text-muted-foreground mt-1">Teaching & Research Aptitude</p>
                      <Badge variant="secondary" className="mt-2 text-[10px]">{papersConfig[1].length > 0 ? `${papersConfig[1].length} parts` : 'Coming soon'}</Badge>
                    </CardContent>
                  </Card>
                  <Card onClick={() => setPaper(2)} className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white mb-3"><Cpu className="h-6 w-6" /></div>
                      <h3 className="font-bold">Paper II</h3>
                      <p className="text-xs text-muted-foreground mt-1">Subject Specific (CS 087)</p>
                      <Badge variant="secondary" className="mt-2 text-[10px]">{papersConfig[2].length > 0 ? `${papersConfig[2].length} parts` : 'Coming soon'}</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setPaper(null)} className="gap-1.5 text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Papers
                </Button>
                {papersConfig[paper].length > 0 ? (
                  <>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Paper {paper === 1 ? 'I' : 'II'} · Parts</h2>
                      <p className="text-xs text-muted-foreground">Choose a part to explore its units, chapters and content.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {papersConfig[paper].map((p) => (
                        <Card key={p.slug} onClick={() => openPart(p.slug, paper, p.part)} className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-[10px]">UGC NET Paper {paper === 1 ? 'I' : 'II'}</Badge>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">Part {p.part}</span>
                            </div>
                            <h3 className="font-semibold leading-tight line-clamp-2">{p.title}</h3>
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{p.excerpt}</p>
                            <div className="mt-3 text-[11px] text-primary inline-flex items-center gap-0.5">
                              Browse units <ChevronRight className="h-3 w-3" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-border bg-background p-8 text-center">
                    <Cpu className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="font-medium">Paper {paper === 1 ? 'I' : 'II'} notes are coming soon</p>
                    <p className="text-sm text-muted-foreground mt-1">We are preparing full book-length notes for this paper.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Regular notes library ── */}
          <div className="mb-5 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes by title, content or tags..."
                className="pl-9"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="sm:w-[260px]">
                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((n) => (
              <Card
                key={n.id}
                onClick={() => navigate('note-reader', { slug: n.slug })}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    {n.subject ? (
                      <Badge variant="secondary" className="text-[10px]">{n.subject.name}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">General</Badge>
                    )}
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-md font-medium capitalize', DIFFICULTY_COLORS[n.difficulty])}>
                      {n.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold leading-tight line-clamp-2">{n.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">{n.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{n.readingTime} min read</span>
                    <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{n.views ?? 0} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <PenTool className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No notes found</p>
          <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
        </div>
      )}
    </div>
  )
}