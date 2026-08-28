'use client'

import * as React from 'react'
import { PenTool, Search, Clock, FileText, ArrowLeft, Filter } from 'lucide-react'
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

export function NotesView() {
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)
  const [notes, setNotes] = React.useState<any[]>([])
  const [subjects, setSubjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [subjectFilter, setSubjectFilter] = React.useState<string>('all')

  React.useEffect(() => {
    api.subjects().then((r) => setSubjects(r.subjects))
    Promise.all([
      api.notes({ limit: 100 }),
      api.subjects(),
    ])
      .then(([n, s]) => {
        setNotes(n.notes)
        setSubjects(s.subjects)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = notes.filter((n) => {
    const matchesQuery =
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      (n.tags ?? '').toLowerCase().includes(query.toLowerCase())
    const matchesSubject = subjectFilter === 'all' || n.subjectId === subjectFilter
    return matchesQuery && matchesSubject
  })

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
        <h1 className="text-3xl font-bold tracking-tight">Notes Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed, exam-ready notes for UGC NET Paper I and Paper II. Each note is syllabus-mapped and includes explanations, examples, and revision summaries.
        </p>
      </div>

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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
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
