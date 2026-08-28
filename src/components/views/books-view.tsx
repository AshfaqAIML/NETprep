'use client'

import * as React from 'react'
import { BookMarked, Search, Star, ExternalLink, ShieldCheck, ShieldOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function BooksView() {
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)
  const highlightSlug = viewParams.highlightSlug as string | undefined
  const highlightRef = React.useRef<HTMLDivElement>(null)

  const [books, setBooks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    api.books()
      .then((r) => setBooks(r.books))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    if (highlightSlug && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightSlug, books])

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.author.toLowerCase().includes(query.toLowerCase()) ||
    (b.tags ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <BookMarked className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Book Library</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Curated recommended books for UGC NET preparation. Each book lists author, publisher, distribution rights, and rating.
        </p>
      </div>

      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author or tag..."
          className="pl-9"
        />
      </div>

      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">Content Rights Notice:</span> NETPrep Hub lists book metadata for reference only. We do not host or distribute copyrighted PDFs. Always purchase books from authorised sellers.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              ref={b.slug === highlightSlug ? highlightRef : undefined}
              className={cn(
                'rounded-xl border bg-card p-5 transition-all',
                b.slug === highlightSlug ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Cover placeholder */}
                <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-tight line-clamp-2">{b.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{b.author}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="font-medium">{b.rating.toFixed(1)}</span>
                    {b.publisher && <span className="text-muted-foreground">· {b.publisher}</span>}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{b.description}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    b.distribution === 'reference-only' && 'border-amber-500/30 text-amber-700 dark:text-amber-300',
                  )}
                >
                  {b.distribution === 'reference-only' ? <ShieldOff className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                  {b.distribution}
                </Badge>
                {b.subject && (
                  <Badge variant="secondary" className="text-[10px]">{b.subject.name}</Badge>
                )}
              </div>
              {b.year && (
                <div className="mt-2 text-[10px] text-muted-foreground">Published: {b.year}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <BookMarked className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No books found</p>
          <p className="text-sm text-muted-foreground">Try a different search.</p>
        </div>
      )}
    </div>
  )
}
