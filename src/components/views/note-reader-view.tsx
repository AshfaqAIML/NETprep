'use client'

import * as React from 'react'
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Tag,
  FileText,
  Sparkles,
  ChevronRight,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Layers,
  Cpu,
  ChevronLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Markdown } from '@/components/shared/markdown'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { cn } from '@/lib/utils'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  hard: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

export function NoteReaderView() {
  const { viewParams, navigate, pushRecentNote } = useAppStore()
  const slug = viewParams.slug as string
  const [note, setNote] = React.useState<any>(null)
  const [related, setRelated] = React.useState<any[]>([])
  const [next, setNext] = React.useState<any>(null)
  const [prev, setPrev] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.note(slug)
      .then((r) => {
        setNote(r.note)
        setRelated(r.related ?? [])
        setNext((r as any).next ?? null)
        setPrev((r as any).prev ?? null)
        pushRecentNote({
          slug: r.note.slug,
          title: r.note.title,
          subject: r.note.subject?.name,
        })
      })
      .finally(() => setLoading(false))
  }, [slug, pushRecentNote])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!note) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">Note not found.</div>

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('notes')} className="mb-4 gap-1 text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Notes
      </Button>

      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {note.subject && (
            <Badge variant="secondary" className="text-[10px]">{note.subject.name}</Badge>
          )}
          {note.topic && (
            <Badge variant="outline" className="text-[10px]">{note.topic.name}</Badge>
          )}
          <span className={cn('text-[10px] px-2 py-0.5 rounded-md font-medium capitalize', DIFFICULTY_COLORS[note.difficulty])}>
            {note.difficulty}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{note.title}</h1>
        <p className="mt-2 text-muted-foreground text-balance">{note.excerpt}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{note.readingTime} min read</span>
          <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{note.views} views</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />NETPrep Editorial</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <BookmarkButton itemType="note" itemId={note.id} />
          {note.topic && (
            <Button variant="outline" size="sm" onClick={() => navigate('practice', { topicId: note.topic.id })} className="gap-1.5">
              <FileQuestion className="h-3.5 w-3.5" />
              Practice Questions
            </Button>
          )}
        </div>
      </header>

      <Separator className="mb-6" />

      {/* Hierarchical Paper → Unit → Chapter cards (global, for any hierarchical book) */}
      {note.content.includes('## UNIT') || note.content.includes('## Unit') ? (
        <PaperOneHierarchical
          content={note.content}
          initialPaper={viewParams.paper === 'II' ? 'II' : viewParams.paper === 'I' ? 'I' : undefined}
          partLabel={viewParams.part ? `Part ${viewParams.part}` : undefined}
        />
      ) : (
        <Markdown content={note.content} />
      )}

      {/* Tags */}
      {note.tags && (
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {note.tags.split(',').map((t: string, i: number) => (
              <Badge key={i} variant="outline" className="text-[10px]">{t.trim()}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Sequential Previous / Next — globally correct */}
      {(prev || next) && (
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {prev ? (
            <button
              onClick={() => navigate('note-reader', { slug: prev.slug })}
              className="group flex items-center gap-3 rounded-lg border border-border p-4 text-left hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Previous</div>
                <div className="text-sm font-medium line-clamp-2">{prev.title}</div>
              </div>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}
          {next ? (
            <button
              onClick={() => navigate('note-reader', { slug: next.slug })}
              className="group flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-left hover:bg-primary/10 transition-colors sm:justify-end"
            >
              <div className="flex-1 min-w-0 sm:text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Next</div>
                <div className="text-sm font-medium line-clamp-2">{next.title}</div>
              </div>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
      )}

      {/* Related — hidden for hierarchical books (they have chapter nav) */}
      {!note.content.includes('## UNIT') && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight mb-4">Related Notes</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <Card
                key={r.id}
                onClick={() => navigate('note-reader', { slug: r.slug })}
                className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground">{r.readingTime} min read</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{r.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.excerpt}</p>
                  <div className="mt-2 text-[10px] text-primary inline-flex items-center gap-0.5">
                    Read note <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function PaperOneHierarchical({
  content,
  initialPaper,
  partLabel,
}: {
  content: string
  initialPaper?: 'I' | 'II'
  partLabel?: string
}) {
  const navigate = useAppStore((s) => s.navigate)
  const [paper, setPaper] = React.useState<'I' | 'II' | null>(initialPaper ?? null)
  const [unitIdx, setUnitIdx] = React.useState<number | null>(null)
  const [chapterIdx, setChapterIdx] = React.useState<number | null>(null)

  // Parse markdown into Paper -> Units -> Chapters
  const parsed = React.useMemo(() => {
    const lines = content.split('\n')
    const papers: any[] = []
    let curPaper: any = null
    let curUnit: any = null
    let curChapter: any = null
    let buffer: string[] = []
    const flush = () => {
      if (curChapter && buffer.length) { curChapter.content = buffer.join('\n'); buffer = [] }
      else if (curUnit && buffer.length && !curChapter) { curUnit.intro = buffer.join('\n'); buffer = [] }
    }
    const normalize = (t: string) => t.toUpperCase().replace(/[\s_\-—–:]+/g, ' ').trim()
    const paperByKey: Record<string, any> = {}
    const getPaper = (title?: string) => {
      const key = normalize(title ?? 'UGC NET Paper I')
      if (paperByKey[key]) return paperByKey[key]
      const p = { title: title ?? 'UGC NET Paper I', units: [] }
      paperByKey[key] = p
      papers.push(p)
      return p
    }
    const unitByPaperKey: Record<string, any> = {}
    const getUnit = (roman: string) => {
      const paper = curPaper ?? getPaper()
      const romanKey = (roman.match(/^unit\s+([ivxlcdm]+)/i) ?? [null, roman.replace(/^unit\s+/i, '')])[1].toUpperCase()
      const key = `${normalize(paper.title)}.${romanKey}`
      if (unitByPaperKey[key]) return { paper, unit: unitByPaperKey[key] }
      const u = { title: roman, intro: '', chapters: [] }
      unitByPaperKey[key] = u
      paper.units.push(u)
      return { paper, unit: u }
    }
    for (const raw of lines) {
      const line = raw.trim()
      const lower = line.toLowerCase()
      // skip clutter lines (careful: do NOT drop '#### n' h4/h5/h6 headings)
      if (/^#+\s*(end\s+of|paper\s+1\b|paper\s+i\b)/.test(lower) || /^##\s+##$/.test(line)) {
        continue
      }
      if (line.startsWith('# ')) {
        flush()
        if (/paper\s+(i|ii|1|2)/i.test(line)) {
          // re-use the paper (do not create a new one on repeated H1)
          curPaper = getPaper(line.replace(/^#\s+/, ''))
          curUnit = null; curChapter = null
        }
      } else if (line.startsWith('## ')) {
        const title = line.replace(/^##\s+/, '')
        const isUnit = /^unit\s+[ivxlci]+/i.test(title) || /^unit\s+\d+/i.test(title)
        if (isUnit) {
          flush()
          const { unit } = getUnit(title)
          curUnit = unit
          curChapter = null
        } else {
          // a non-unit ## heading directly at unit level -> treat as a chapter
          flush()
          curChapter = { title, content: '' }
          if (!curUnit) { curUnit = { title: 'Unit I', intro: '', chapters: [] }; getPaper().units.push(curUnit) }
          curUnit.chapters.push(curChapter)
          buffer = []
        }
      } else if (line.startsWith('### ')) {
        const title = line.replace(/^###\s+/, '')
        if (/^chapter\s*\d+/i.test(title)) {
          // start a new chapter
          flush()
          curChapter = { title, content: '' }
          if (!curUnit) { curUnit = { title: 'Unit I', intro: '', chapters: [] }; getPaper().units.push(curUnit) }
          curUnit.chapters.push(curChapter)
          buffer = []
        } else if (curChapter && buffer.length === 0) {
          // a ### <name> line directly after a CHAPTER header -> append name to chapter title
          curChapter.title = `${curChapter.title} — ${title}`
        } else {
          // standalone ### subtopic line (like 3.1 ...) -> goes into chapter content with heading size
          buffer.push(line)
        }
      } else if (line.startsWith('#### ') || line.startsWith('##### ') || line.startsWith('###### ')) {
        buffer.push(line)
      } else {
        buffer.push(raw)
      }
    }
    flush()
    // collapse all papers into one Paper I (merged units) — Paper II handled separately in UI
    return papers
  }, [content])

  // Derive Paper I / Paper II — merge ALL parsed papers into a single Paper I
  const paperI = React.useMemo(() => {
    const allUnits: any[] = []
    for (const p of parsed) for (const u of p.units) allUnits.push(u)
    return { title: 'UGC NET Paper I — Teaching & Research Aptitude', units: allUnits }
  }, [parsed])
  const paperII = React.useMemo(() => ({ title: 'Paper II — Subject Specific (087)', units: Array.from({ length: 10 }, (_, i) => ({ title: `Unit ${i + 1}`, intro: 'Content coming soon — see Syllabus for details.', chapters: [] })) }), [])

  // Level 1: Paper selection
  if (paper === null) {
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Card onClick={() => setPaper('I')} className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group">
            <CardContent className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white mb-3"><GraduationCap className="h-6 w-6" /></div>
              <h3 className="font-bold">Paper I</h3>
              <p className="text-xs text-muted-foreground mt-1">Teaching & Research Aptitude — 10 units</p>
              <Badge variant="secondary" className="mt-2 text-[10px]">{paperI?.units.length ?? 10} units</Badge>
            </CardContent>
          </Card>
          <Card onClick={() => setPaper('II')} className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group">
            <CardContent className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white mb-3"><Cpu className="h-6 w-6" /></div>
              <h3 className="font-bold">Paper II</h3>
              <p className="text-xs text-muted-foreground mt-1">Computer Science 087 — 10 units</p>
              <Badge variant="secondary" className="mt-2 text-[10px]">10 units</Badge>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground text-center">Choose a paper to explore its units and chapters with proper headings.</p>
      </div>
    )
  }

  const activePaper = paper === 'I' ? paperI : paperII

  // Level 2: Units
  if (unitIdx === null) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => (initialPaper ? navigate('notes', { paper }) : setPaper(null))} className="gap-1.5"><ChevronLeft className="h-3.5 w-3.5" /> {initialPaper ? 'Back to Parts' : 'Back to Papers'}</Button>
        <h2 className="text-xl font-bold">{activePaper.title} — Units{partLabel ? ` · ${partLabel}` : ''}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activePaper.units.map((u: any, i: number) => (
            <Card key={i} onClick={() => setUnitIdx(i)} className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground">Unit {i + 1}</span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">{u.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{u.chapters.length ? `${u.chapters.length} chapters` : 'No chapters yet'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const activeUnit = activePaper.units[unitIdx]

  // Level 3: Chapters
  if (chapterIdx === null) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setUnitIdx(null)} className="gap-1.5"><ChevronLeft className="h-3.5 w-3.5" /> Back to Units</Button>
        <h2 className="text-xl font-bold">{activeUnit.title}</h2>
        {activeUnit.intro && <div className="text-sm text-muted-foreground"><Markdown content={activeUnit.intro} /></div>}
        <div className="grid sm:grid-cols-2 gap-3">
          {activeUnit.chapters.length ? activeUnit.chapters.map((c: any, i: number) => (
            <Card key={i} onClick={() => setChapterIdx(i)} className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="p-4">
                <div className="text-[10px] text-muted-foreground">Chapter {i + 1}</div>
                <h3 className="font-semibold text-sm line-clamp-2">{c.title}</h3>
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">No chapters yet for this unit.</CardContent></Card>
          )}
        </div>
      </div>
    )
  }

  const activeChapter = activeUnit.chapters[chapterIdx]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setChapterIdx(null)} className="gap-1.5"><ChevronLeft className="h-3.5 w-3.5" /> Back to Chapters</Button>
        <span className="text-xs text-muted-foreground">/ {activeUnit.title} / {activeChapter.title}</span>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-xl">{activeChapter.title}</CardTitle></CardHeader>
        <CardContent><Markdown content={activeChapter.content} /></CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" disabled={chapterIdx === 0} onClick={() => setChapterIdx((v) => (v !== null ? Math.max(0, v - 1) : 0))} className="gap-1.5"><ChevronLeft className="h-3.5 w-3.5" /> Previous</Button>
        <Button variant="outline" size="sm" disabled={chapterIdx === activeUnit.chapters.length - 1} onClick={() => setChapterIdx((v) => (v !== null ? Math.min(activeUnit.chapters.length - 1, v + 1) : 0))} className="gap-1.5">Next <ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  )
}
