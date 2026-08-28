'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, FileText, Sparkles, BookMarked, FileQuestion, Library, Newspaper, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'

export function SearchModal() {
  const { searchOpen, setSearchOpen, navigate, setLastQuery, lastQuery } = useAppStore()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (!searchOpen) {
      setQuery('')
      setResults(null)
    }
  }, [searchOpen])

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query.trim())
        setResults(data)
        setLastQuery(query.trim())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, setLastQuery])

  // keyboard shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  const handleNavigate = (view: any, params?: any) => {
    setSearchOpen(false)
    navigate(view, params)
  }

  const total = results?.total ?? 0

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>Search across notes, cheat sheets, books, questions, subjects, and articles</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, notes, topics, questions, subjects..."
            className="border-0 focus-visible:ring-0 px-0 h-8"
          />
          <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="overflow-y-auto max-h-[60vh] scrollbar-thin">
          {!query.trim() && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground mb-1">Search the knowledge base</p>
              <p>Find notes, cheat sheets, books, questions, subjects and articles</p>
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                {['research methodology', 'normalization', 'teaching aptitude', 'binary tree', 'pyq 2023'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="text-xs px-2 py-1 rounded-md border border-border bg-muted/40 hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!loading && results && total === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">No results for &quot;{query}&quot;</p>
              <p>Try a different keyword or check spelling.</p>
            </div>
          )}

          {!loading && results && total > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs text-muted-foreground">
                {total} result{total !== 1 ? 's' : ''} for &quot;{query}&quot;
              </div>

              {results.results.notes?.length > 0 && (
                <SearchGroup title="Notes" icon={FileText}>
                  {results.results.notes.map((n: any) => (
                    <SearchItem
                      key={n.id}
                      title={n.title}
                      subtitle={n.excerpt}
                      meta={n.subject?.name}
                      onClick={() => handleNavigate('note-reader', { slug: n.slug })}
                    />
                  ))}
                </SearchGroup>
              )}

              {results.results.cheatSheets?.length > 0 && (
                <SearchGroup title="Cheat Sheets" icon={Sparkles}>
                  {results.results.cheatSheets.map((c: any) => (
                    <SearchItem
                      key={c.id}
                      title={c.title}
                      subtitle={c.summary}
                      onClick={() => handleNavigate('cheat-sheet-reader', { slug: c.slug })}
                    />
                  ))}
                </SearchGroup>
              )}

              {results.results.subjects?.length > 0 && (
                <SearchGroup title="Subjects" icon={Library}>
                  {results.results.subjects.map((s: any) => (
                    <SearchItem
                      key={s.id}
                      title={s.name}
                      subtitle={s.description}
                      meta={`Code ${s.code}`}
                      onClick={() => handleNavigate('subject-detail', { slug: s.slug })}
                    />
                  ))}
                </SearchGroup>
              )}

              {results.results.books?.length > 0 && (
                <SearchGroup title="Books" icon={BookMarked}>
                  {results.results.books.map((b: any) => (
                    <SearchItem
                      key={b.id}
                      title={b.title}
                      subtitle={b.description}
                      meta={b.author}
                      onClick={() => handleNavigate('books', { highlightSlug: b.slug })}
                    />
                  ))}
                </SearchGroup>
              )}

              {results.results.questions?.length > 0 && (
                <SearchGroup title="Questions" icon={FileQuestion}>
                  {results.results.questions.map((q: any) => (
                    <SearchItem
                      key={q.id}
                      title={q.questionText}
                      subtitle={q.topic?.unit?.subject?.name}
                      meta={`Difficulty: ${q.difficulty}`}
                      onClick={() => handleNavigate('practice', { questionId: q.id })}
                    />
                  ))}
                </SearchGroup>
              )}

              {results.results.articles?.length > 0 && (
                <SearchGroup title="Articles" icon={Newspaper}>
                  {results.results.articles.map((a: any) => (
                    <SearchItem
                      key={a.id}
                      title={a.title}
                      subtitle={a.excerpt}
                      meta={a.category}
                      onClick={() => handleNavigate('article-reader', { slug: a.slug })}
                    />
                  ))}
                </SearchGroup>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SearchGroup({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function SearchItem({
  title,
  subtitle,
  meta,
  onClick,
}: {
  title: string
  subtitle?: string
  meta?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
    >
      <div className="font-medium text-sm text-foreground line-clamp-1">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{subtitle}</div>}
      {meta && (
        <div className="mt-1">
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">{meta}</Badge>
        </div>
      )}
    </button>
  )
}
