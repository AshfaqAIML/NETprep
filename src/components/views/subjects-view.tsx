'use client'

import * as React from 'react'
import { Library, BookOpen, PenTool, FileQuestion, FileText, Sparkles, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

export function SubjectsView() {
  const navigate = useAppStore((s) => s.navigate)
  const [subjects, setSubjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'I' | 'II'>('all')

  React.useEffect(() => {
    api.subjects()
      .then((r) => setSubjects(r.subjects))
      .finally(() => setLoading(false))
  }, [])

  const filtered = subjects.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'all' || s.paper === filter
    return matchesQuery && matchesFilter
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'Subjects' }]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose your UGC NET Paper I or Paper II subject to access its full syllabus, notes, books, PYQs and practice questions.
        </p>
      </div>

      <div className="mb-5 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects by name or code..."
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="I">Paper I</TabsTrigger>
            <TabsTrigger value="II">Paper II</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card
              key={s.id}
              onClick={() => navigate('subject-detail', { slug: s.slug })}
              className="group cursor-pointer relative overflow-hidden transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', s.color ?? 'from-emerald-500 to-teal-600')} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', s.color ?? 'from-emerald-500 to-teal-600')}>
                    <Library className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[10px]">Code {s.code}</Badge>
                    <Badge variant="secondary" className="text-[10px]">Paper {s.paper}</Badge>
                  </div>
                </div>
                <h3 className="mt-3 font-semibold leading-tight">{s.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{s.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                  <ResourceChip icon={BookOpen} label="Units" count={s._count?.units ?? 0} />
                  <ResourceChip icon={PenTool} label="Notes" count={s._count?.notes ?? 0} />
                  <ResourceChip icon={Sparkles} label="Cheat Sheets" count={s._count?.cheatsheets ?? 0} />
                  <ResourceChip icon={BookOpen} label="Books" count={s._count?.books ?? 0} />
                  <ResourceChip icon={FileQuestion} label="Questions" count={s._count?.questions ?? 0} />
                  <ResourceChip icon={FileText} label="PYQs" count={s._count?.pyqs ?? 0} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Library className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No subjects found</p>
          <p className="text-sm text-muted-foreground">Try a different search term or filter.</p>
        </div>
      )}
    </div>
  )
}

function ResourceChip({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{count}</span>
    </div>
  )
}
