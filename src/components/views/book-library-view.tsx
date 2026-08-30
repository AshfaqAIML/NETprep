'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  BookMarked,
  Search,
  ArrowRight,
  Clock,
  Layers,
  BookCheck,
  Library,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

export function BookLibraryView() {
  const navigate = useAppStore((s) => s.navigate)
  const [subjects, setSubjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [selectedSubject, setSelectedSubject] = React.useState<any>(null)

  React.useEffect(() => {
    api.bookLibrary()
      .then((r) => setSubjects(r.subjects))
      .finally(() => setLoading(false))
  }, [])

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.books.some((b: any) => b.title.toLowerCase().includes(query.toLowerCase()))
  )

  // Subject detail view (book selector for multi-book subjects)
  if (selectedSubject) {
    return (
      <SubjectBookSelector
        subject={selectedSubject}
        onBack={() => setSelectedSubject(null)}
        onOpenBook={(book) => navigate('book-reader-pro', { bookId: book.id, bookSlug: book.slug, subjectSlug: selectedSubject.slug })}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => navigate('home') },
        { label: 'Book Library' },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Library className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Book Library</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse UGC NET books by subject. Track your reading progress, highlights, and bookmarks.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects or book titles..."
          className="pl-9 max-w-xl"
        />
      </div>

      {/* Subject cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Library className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No subjects found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((subject, idx) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              index={idx}
              onClick={() => {
                if (subject.books.length === 1) {
                  // Single book — open reader directly
                  navigate('book-reader-pro', {
                    bookId: subject.books[0].id,
                    bookSlug: subject.books[0].slug,
                    subjectSlug: subject.slug,
                  })
                } else {
                  // Multiple books — show selector
                  setSelectedSubject(subject)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubjectCard({ subject, index, onClick }: { subject: any; index: number; onClick: () => void }) {
  const lastRead = subject.lastReadBook
  const progressPct = lastRead?.progress?.completionPct ?? 0
  const hasProgress = subject.hasProgress

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        onClick={onClick}
        className="group cursor-pointer relative overflow-hidden transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
      >
        <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', subject.color ?? 'from-amber-500 to-orange-600')} />
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', subject.color ?? 'from-amber-500 to-orange-600')}>
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold leading-tight line-clamp-2">{subject.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {subject.bookCount} {subject.bookCount === 1 ? 'book' : 'books'}
                </Badge>
                {hasProgress && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                    <BookCheck className="h-2.5 w-2.5 mr-0.5" />
                    Reading
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress section */}
          {hasProgress && lastRead ? (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span className="truncate">{lastRead.title}</span>
                <span className="font-semibold text-foreground">{Math.round(progressPct)}%</span>
              </div>
              <Progress value={progressPct} className="h-1" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Page {lastRead.progress?.currentPage ?? 0}{lastRead.progress?.totalPages ? ` / ${lastRead.progress.totalPages}` : ''}
                </span>
                <span className="text-[10px] text-primary inline-flex items-center gap-0.5 font-medium">
                  Continue <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-3 text-xs text-muted-foreground">
              {subject.bookCount === 1 ? '1 book available' : `${subject.bookCount} books available`}
            </div>
          )}

          {/* Book preview thumbnails */}
          <div className="flex gap-1.5">
            {subject.books.slice(0, 4).map((book: any) => (
              <div
                key={book.id}
                className="h-16 w-12 shrink-0 rounded-md bg-gradient-to-br from-amber-500/15 to-orange-600/15 border border-amber-500/20 flex items-center justify-center"
              >
                <BookMarked className="h-4 w-4 text-amber-600/60" />
              </div>
            ))}
            {subject.books.length > 4 && (
              <div className="h-16 w-12 shrink-0 rounded-md bg-muted/40 border border-border flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-medium">+{subject.books.length - 4}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SubjectBookSelector({ subject, onBack, onOpenBook }: { subject: any; onBack: () => void; onOpenBook: (book: any) => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => window.location.hash = '' },
        { label: 'Book Library', onClick: onBack },
        { label: subject.name },
      ]} />

      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to Subjects
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white', subject.color ?? 'from-amber-500 to-orange-600')}>
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
            <p className="text-xs text-muted-foreground">{subject.books.length} books available — choose one to start reading</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subject.books.map((book: any, idx: number) => {
          const progress = book.progress
          const pct = progress?.completionPct ?? 0
          return (
            <Card
              key={book.id}
              onClick={() => onOpenBook(book)}
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-20 w-14 shrink-0 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                    <BookMarked className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                    {book._count?.chapters > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">{book._count.chapters} chapters</p>
                    )}
                  </div>
                </div>

                {progress ? (
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{Math.round(pct)}%</span>
                    </div>
                    <Progress value={pct} className="h-1" />
                    <div className="mt-2 text-[10px] text-primary font-medium">
                      Continue from Page {progress.currentPage} →
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Start Reading
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
