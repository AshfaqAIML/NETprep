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
  FileText,
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

function BookCover({ title, author, color }: { title: string; author: string; color?: string }) {
  return (
    <div className={cn('h-20 w-14 shrink-0 rounded-md bg-gradient-to-br border flex flex-col items-center justify-center p-1.5 text-center overflow-hidden', color ?? 'from-amber-500/20 to-orange-600/20 border-amber-500/30')}>
      <div className="text-[7px] font-bold leading-tight line-clamp-3 text-amber-900 dark:text-amber-100">{title.slice(0, 60)}</div>
      <div className="text-[6px] text-amber-700/70 dark:text-amber-300/70 mt-1 line-clamp-1">{author.slice(0, 20)}</div>
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
        className="group cursor-pointer relative overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
      >
        <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', subject.color ?? 'from-amber-500 to-orange-600')} />
        <CardContent className="p-5">
          <div className="flex items-start gap-3.5 mb-4">
            <div className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', subject.color ?? 'from-amber-500 to-orange-600')}>
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight line-clamp-2 tracking-tight">{subject.name}</h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium bg-muted">
                  <Library className="h-3 w-3 mr-1" />
                  {subject.bookCount} {subject.bookCount === 1 ? 'book' : 'books'}
                </Badge>
                {hasProgress ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.round(progressPct)}% reading
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    New
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress section */}
          {hasProgress && lastRead ? (
            <div className="mb-4 rounded-lg bg-muted/30 border border-border/50 p-3">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="truncate font-medium text-foreground pr-2">{lastRead.title}</span>
                <span className="font-bold text-primary shrink-0">{Math.round(progressPct)}%</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Page {lastRead.progress?.currentPage ?? 0}{lastRead.progress?.totalPages ? ` / ${lastRead.progress.totalPages}` : ''}
                </span>
                <span className="text-[11px] text-primary inline-flex items-center gap-1 font-semibold">
                  Continue <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              {subject.bookCount === 1 ? 'Single volume' : `${subject.bookCount} volumes`} • Tap to browse
            </div>
          )}

          {/* Book preview with professional covers */}
          <div className="flex gap-2">
            {subject.books.slice(0, 4).map((book: any) => (
              <div key={book.id} className="relative group/cover">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt={book.title} className="h-20 w-14 rounded-md object-cover border border-border shadow-sm" />
                ) : (
                  <BookCover title={book.title} author={book.author} color={subject.color} />
                )}
                {book.fileUrl && <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 border border-white shadow-sm" title="PDF ready" />}
              </div>
            ))}
            {subject.books.length > 4 && (
              <div className="h-20 w-14 shrink-0 rounded-md bg-muted border border-dashed border-border flex flex-col items-center justify-center gap-0.5">
                <span className="text-xs font-bold text-foreground">+{subject.books.length - 4}</span>
                <span className="text-[9px] text-muted-foreground">more</span>
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
        {subject.books.map((book: any) => {
          const progress = book.progress
          const pct = progress?.completionPct ?? 0
          return (
            <Card
              key={book.id}
              onClick={() => onOpenBook(book)}
              className="group cursor-pointer overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3.5 mb-4">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverUrl} alt={book.title} className="h-24 w-16 rounded-md object-cover border border-border shadow-sm shrink-0" />
                  ) : (
                    <div className="h-24 w-16 shrink-0 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-600/20 flex flex-col items-center justify-center p-2 text-center text-white shadow-md">
                      <BookOpen className="h-5 w-5 mb-1 opacity-90" />
                      <div className="text-[7px] font-bold leading-tight line-clamp-3">{book.title.slice(0, 50)}</div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2 tracking-tight">{book.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        <FileText className="h-3 w-3 mr-1" />PDF
                      </Badge>
                      {book.pageCount && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{book.pageCount} pages</Badge>}
                    </div>
                    {book._count?.chapters > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">{book._count.chapters} chapters • {book.fileUrl ? 'Ready to read' : 'Reference only'}</p>
                    )}
                  </div>
                </div>

                {progress ? (
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-muted-foreground font-medium">Reading progress</span>
                      <span className="font-bold text-primary">{Math.round(pct)}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Page {progress.currentPage}{progress.totalPages ? ` / ${progress.totalPages}` : ''}</span>
                      <span className="text-[11px] text-primary font-semibold inline-flex items-center gap-1">Continue <ChevronRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" className="w-full gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
                    <BookOpen className="h-3.5 w-3.5" /> {book.fileUrl ? 'Open Book' : 'View Details'}
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
