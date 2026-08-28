'use client'

import * as React from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Moon,
  Sun,
  Bookmark,
  BookmarkCheck,
  Loader2,
  FileText,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { Breadcrumbs } from '@/components/shared/states'
import { toast } from 'sonner'

export function BookReaderView() {
  const { viewParams, navigate } = useAppStore()
  const bookSlug = viewParams.slug as string

  const [book, setBook] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [zoom, setZoom] = React.useState(100)
  const [darkMode, setDarkMode] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const readerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!bookSlug) return
    setLoading(true)
    api.books()
      .then((r) => {
        const found = r.books.find((b: any) => b.slug === bookSlug)
        setBook(found ?? null)
      })
      .finally(() => setLoading(false))
  }, [bookSlug])

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrentPage((p) => Math.max(1, p - 1))
      else if (e.key === 'ArrowRight') setCurrentPage((p) => p + 1)
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(200, z + 10))
      else if (e.key === '-') setZoom((z) => Math.max(50, z - 10))
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!book) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">Book not found.</div>

  return (
    <div ref={readerRef} className={cn('min-h-screen', darkMode && 'bg-slate-900')}>
      <div className={cn('mx-auto max-w-4xl px-4 sm:px-6 py-8', darkMode && 'text-slate-100')}>
        <Breadcrumbs items={[
          { label: 'Home', onClick: () => navigate('home') },
          { label: 'Books', onClick: () => navigate('books') },
          { label: book.title },
        ]} />

        {/* Book header */}
        <Card className={cn('mb-4', darkMode && 'bg-slate-800 border-slate-700')}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-amber-700 border border-amber-500/30">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight">{book.title}</h1>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {book.distribution === 'reference-only'
                      ? <><ShieldOff className="h-3 w-3 mr-1" />Reference Only</>
                      : <><ShieldCheck className="h-3 w-3 mr-1" />{book.distribution}</>}
                  </Badge>
                  {book.subject && <Badge variant="secondary" className="text-[10px]">{book.subject.name}</Badge>}
                  {book.year && <Badge variant="outline" className="text-[10px]">{book.year}</Badge>}
                </div>
              </div>
              <BookmarkButton itemType="book" itemId={book.id} />
            </div>
          </CardContent>
        </Card>

        {/* Reader toolbar */}
        <div className={cn('flex items-center gap-2 mb-4 p-2 rounded-lg border', darkMode ? 'bg-slate-800 border-slate-700' : 'bg-card border-border')}>
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground px-2">Page {currentPage}</span>
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => p + 1)} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(50, z - 10))} className="gap-1">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(200, z + 10))} className="gap-1">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className="gap-1">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="gap-1">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">←→</kbd>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">+/-</kbd>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">F</kbd>
          </div>
        </div>

        {/* Reader content */}
        <Card className={cn('overflow-hidden', darkMode && 'bg-slate-800 border-slate-700')}>
          <CardContent className="p-0">
            <div
              className="flex items-center justify-center min-h-[600px] p-8"
              style={{ fontSize: `${zoom}%` }}
            >
              {book.fileUrl ? (
                /* Full PDF reader when file is uploaded */
                <div className="w-full h-[700px]">
                  <iframe
                    src={book.fileUrl}
                    className="w-full h-full rounded-lg border border-border"
                    title={book.title}
                    style={{ filter: darkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
                  />
                </div>
              ) : (
                /* Placeholder when no PDF uploaded */
                <div className={cn('max-w-prose w-full space-y-4', darkMode ? 'text-slate-200' : 'text-foreground')}>
                  <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-4">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold">{book.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">by {book.author}</p>
                  </div>

                  <div className={cn('rounded-lg border p-4 text-sm', darkMode ? 'bg-slate-900 border-slate-700' : 'bg-muted/30 border-border')}>
                    <p className="font-semibold mb-2">Book Description</p>
                    <p className="text-muted-foreground">{book.description}</p>
                  </div>

                  <div className={cn('rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm')}>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-700 dark:text-amber-300">Content Rights</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This book is listed as <strong>{book.distribution}</strong>.
                          {book.distribution === 'reference-only'
                            ? ' The full PDF is not available for online reading due to copyright. Please purchase from authorised sellers.'
                            : ' Download may be available where permitted.'}
                        </p>
                      {book.publisher && (
                        <p className="text-xs text-muted-foreground mt-1">Publisher: {book.publisher}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="font-semibold text-sm">Table of Contents (Sample)</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px]">Ch 1</Badge> Introduction</div>
                    <div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px]">Ch 2</Badge> Fundamentals</div>
                    <div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px]">Ch 3</Badge> Advanced Topics</div>
                    <div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px]">Ch 4</Badge> Practice Questions</div>
                    <div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px]">Ch 5</Badge> Previous Year Analysis</div>
                  </div>
                </div>

                <Separator />

                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of sample preview.
                    {book.distribution === 'reference-only'
                      ? ' Full PDF reader requires distribution rights.'
                      : ' Full reader will be available when the PDF is uploaded.'}
                  </p>
                  {book.distribution !== 'reference-only' && book.downloadEnabled && book.fileUrl && (
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" asChild>
                      <a href={book.fileUrl} download>
                        <FileText className="h-3.5 w-3.5" /> Download PDF
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related books */}
        <div className="mt-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('books')} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Books
          </Button>
        </div>
      </div>
    </div>
  )
}
