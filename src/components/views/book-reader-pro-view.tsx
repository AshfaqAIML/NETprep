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
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Highlighter,
  StickyNote,
  Search,
  Settings,
  List,
  X,
  Save,
  Trash2,
  FileText,
  Clock,
  Loader2,
  Palette,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'
import { toast } from 'sonner'

const HIGHLIGHT_COLORS = [
  { key: 'yellow', class: 'bg-yellow-400', label: 'Yellow' },
  { key: 'green', class: 'bg-green-400', label: 'Green' },
  { key: 'blue', class: 'bg-blue-400', label: 'Blue' },
  { key: 'pink', class: 'bg-pink-400', label: 'Pink' },
  { key: 'orange', class: 'bg-orange-400', label: 'Orange' },
]

type SidebarTab = 'contents' | 'highlights' | 'notes' | 'bookmarks' | 'search'

export function BookReaderProView() {
  const { viewParams, navigate } = useAppStore()
  const bookId = viewParams.bookId as string
  const bookSlug = viewParams.bookSlug as string
  const subjectSlug = viewParams.subjectSlug as string

  const [book, setBook] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  // Reader state
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(100)
  const [zoom, setZoom] = React.useState(100)
  const [darkMode, setDarkMode] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [sidebarTab, setSidebarTab] = React.useState<SidebarTab>('contents')
  const [showSettings, setShowSettings] = React.useState(false)
  const [showShortcuts, setShowShortcuts] = React.useState(false)

  // Reader data
  const [progress, setProgress] = React.useState<any>(null)
  const [highlights, setHighlights] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState<any[]>([])
  const [bookmarks, setBookmarks] = React.useState<any[]>([])
  const [chapters, setChapters] = React.useState<any[]>([])

  // Highlight creation
  const [selectedText, setSelectedText] = React.useState('')
  const [showHighlightBar, setShowHighlightBar] = React.useState(false)
  const [highlightColor, setHighlightColor] = React.useState('yellow')

  // Note creation
  const [showNoteDialog, setShowNoteDialog] = React.useState(false)
  const [noteContent, setNoteContent] = React.useState('')
  const [noteTitle, setNoteTitle] = React.useState('')

  // Search
  const [searchQuery, setSearchQuery] = React.useState('')

  const readerRef = React.useRef<HTMLDivElement>(null)

  // Load book data
  React.useEffect(() => {
    if (!bookId) return
    setLoading(true)
    Promise.all([
      api.books().then((r) => {
        const found = r.books.find((b: any) => b.id === bookId || b.slug === bookSlug)
        if (found) {
          setBook(found)
          setTotalPages(found.pageCount ?? 100)
        } else {
          setError(true)
        }
      }),
      api.bookProgress(bookId).then((r) => {
        if (r.progress) {
          setProgress(r.progress)
          setCurrentPage(r.progress.currentPage ?? 1)
        }
      }),
      api.bookHighlights(bookId).then((r) => setHighlights(r.highlights ?? [])),
      api.bookNotes(bookId).then((r) => setNotes(r.notes ?? [])),
      api.bookBookmarks(bookId).then((r) => setBookmarks(r.bookmarks ?? [])),
    ]).finally(() => setLoading(false))
  }, [bookId, bookSlug])

  // Save progress on page change (debounced)
  React.useEffect(() => {
    if (!book || loading) return
    const timer = setTimeout(() => {
      const pct = totalPages > 0 ? (currentPage / totalPages) * 100 : 0
      api.updateBookProgress({
        bookId: book.id,
        currentPage,
        totalPages,
        completionPct: pct,
      }).then((r) => setProgress(r.progress)).catch(() => {})
    }, 2000)
    return () => clearTimeout(timer)
  }, [currentPage, totalPages, book, loading])

  // Fullscreen
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

  // Bookmark handler (defined before keyboard effect to avoid use-before-define)
  const handleBookmark = React.useCallback(async () => {
    if (!book) return
    const existing = bookmarks.find((b) => b.pageNumber === currentPage)
    if (existing) {
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id))
      try { await api.deleteBookmark(existing.id); toast.success('Bookmark removed') } catch (e) {}
    } else {
      try {
        const r = await api.createBookmark({ bookId: book.id, pageNumber: currentPage, title: `Page ${currentPage}` })
        setBookmarks((prev) => [...prev, r.bookmark])
        toast.success('Bookmark added')
      } catch (e) { toast.error('Failed to add bookmark') }
    }
  }, [book, currentPage, bookmarks])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)) }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom((z) => Math.min(200, z + 10)) }
      else if (e.key === '-') { e.preventDefault(); setZoom((z) => Math.max(50, z - 10)) }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen() }
      else if (e.key === 'b' || e.key === 'B') { e.preventDefault(); handleBookmark() }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setShowNoteDialog(true) }
      else if (e.key === 'Escape') { setShowSettings(false); setShowShortcuts(false); setShowNoteDialog(false) }
      else if (e.key === '/') { e.preventDefault(); setSidebarOpen(true); setSidebarTab('search'); }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [totalPages, handleBookmark])

  // Text selection handler
  React.useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      if (text && text.length > 2) {
        setSelectedText(text)
        setShowHighlightBar(true)
      } else {
        setShowHighlightBar(false)
      }
    }
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
    }
  }, [])

  const handleHighlight = async (color: string) => {
    if (!selectedText || !book) return
    try {
      const r = await api.createHighlight({
        bookId: book.id,
        pageNumber: currentPage,
        selectedText,
        color,
      })
      setHighlights((prev) => [r.highlight, ...prev])
      setSelectedText('')
      setShowHighlightBar(false)
      toast.success('Highlight saved')
    } catch (e) {
      toast.error('Failed to save highlight')
    }
  }

  const handleDeleteHighlight = async (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
    try { await api.deleteHighlight(id) } catch (e) { toast.error('Failed to delete') }
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !book) return
    try {
      const r = await api.createBookNote({
        bookId: book.id,
        title: noteTitle || `Note on Page ${currentPage}`,
        content: noteContent,
        pageNumber: currentPage,
      })
      setNotes((prev) => [r.note, ...prev])
      setNoteContent('')
      setNoteTitle('')
      setShowNoteDialog(false)
      toast.success('Note saved')
    } catch (e) { toast.error('Failed to save note') }
  }

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try { await api.deleteBookNote(id) } catch (e) {}
  }

  const isBookmarked = bookmarks.some((b) => b.pageNumber === currentPage)
  const completionPct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-bold mb-2">Book not found</h2>
        <p className="text-sm text-muted-foreground mb-4">The book you're looking for doesn't exist or has been removed.</p>
        <Button variant="outline" onClick={() => navigate('book-library')}>Back to Library</Button>
      </div>
    )
  }

  return (
    <div ref={readerRef} className={cn('min-h-screen flex flex-col', darkMode ? 'bg-slate-900' : 'bg-background')}>
      {/* Reader Toolbar */}
      <div className={cn(
        'sticky top-0 z-30 border-b',
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-background/95 backdrop-blur border-border'
      )}>
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Left controls */}
          <Button variant="ghost" size="sm" onClick={() => navigate('book-library')} className="gap-1.5 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Library</span>
          </Button>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Book title */}
          <div className="flex-1 min-w-0">
            <div className={cn('text-sm font-semibold truncate', darkMode ? 'text-slate-100' : '')}>{book.title}</div>
            <div className="text-[10px] text-muted-foreground truncate">{book.author}</div>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-xs">
              <Input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(totalPages, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-14 h-8 text-center"
              />
              <span className="text-muted-foreground">/ {totalPages}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Right controls */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar (S)">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className={cn('h-8 w-8', isBookmarked && 'text-amber-500')} onClick={handleBookmark} title="Bookmark (B)">
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNoteDialog(true)} title="Add note (N)">
            <StickyNote className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDarkMode(!darkMode)} title="Dark mode">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title="Fullscreen (F)">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Main reader area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Reader content */}
        <div className="flex-1 overflow-auto" onClick={() => setShowHighlightBar(false)}>
          {book.fileUrl ? (
            <div className="w-full h-full" style={{ filter: darkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}>
              <iframe
                src={book.fileUrl}
                className="w-full h-full border-0"
                style={{ minHeight: 'calc(100vh - 120px)' }}
                title={book.title}
              />
            </div>
          ) : (
            <div className={cn('max-w-3xl mx-auto px-8 py-12', darkMode ? 'text-slate-200' : '')} style={{ fontSize: `${zoom}%` }}>
              {/* Sample content when no PDF uploaded */}
              <div className="text-center mb-12">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-4">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                <p className="text-muted-foreground">by {book.author}</p>
              </div>

              <div className={cn('rounded-lg border p-6 mb-6', darkMode ? 'bg-slate-800 border-slate-700' : 'bg-muted/30 border-border')}>
                <p className="font-semibold mb-2">Description</p>
                <p className="text-muted-foreground text-sm">{book.description}</p>
              </div>

              <div className="prose max-w-none">
                <h2>Chapter {currentPage}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This is a sample preview of the book. The full PDF reader will display here once a PDF file is uploaded for this book.
                  Currently, you can see the book metadata, navigate pages, create highlights, add notes, and bookmark pages.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Select any text on this page to create a highlight. Use the toolbar above to navigate, zoom, bookmark, and access reader settings.
                  Keyboard shortcuts are available: use arrow keys for page navigation, B for bookmark, N for note, F for fullscreen.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Page {currentPage} of {totalPages}. Reading progress: {completionPct}% complete.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Highlight selection toolbar */}
        {showHighlightBar && selectedText && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-lg border border-border bg-card shadow-lg p-2">
            <span className="text-xs text-muted-foreground px-2 hidden sm:inline">Highlight:</span>
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => handleHighlight(c.key)}
                className={cn('h-7 w-7 rounded-full border-2 border-white shadow transition-transform hover:scale-110', c.class)}
                title={c.label}
              />
            ))}
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button size="sm" variant="ghost" onClick={() => { setShowNoteDialog(true) }} className="gap-1 text-xs">
              <StickyNote className="h-3.5 w-3.5" /> Note
            </Button>
          </div>
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <div className={cn(
            'w-72 shrink-0 border-l overflow-y-auto',
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-card border-border'
          )}>
            <div className="sticky top-0 bg-inherit border-b p-2">
              <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as SidebarTab)}>
                <TabsList className="grid grid-cols-5 h-auto">
                  <TabsTrigger value="contents" className="text-[10px] p-1"><List className="h-3.5 w-3.5" /></TabsTrigger>
                  <TabsTrigger value="highlights" className="text-[10px] p-1"><Highlighter className="h-3.5 w-3.5" /></TabsTrigger>
                  <TabsTrigger value="notes" className="text-[10px] p-1"><StickyNote className="h-3.5 w-3.5" /></TabsTrigger>
                  <TabsTrigger value="bookmarks" className="text-[10px] p-1"><Bookmark className="h-3.5 w-3.5" /></TabsTrigger>
                  <TabsTrigger value="search" className="text-[10px] p-1"><Search className="h-3.5 w-3.5" /></TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="p-3">
              {/* Table of Contents */}
              {sidebarTab === 'contents' && (
                <div className="space-y-1">
                  {chapters.length > 0 ? chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setCurrentPage(ch.pageNumber)}
                      className="block w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted/30"
                    >
                      <span className="text-muted-foreground mr-1">{ch.chapterOrder}.</span>
                      {ch.title}
                    </button>
                  )) : (
                    <div className="text-center py-8">
                      <List className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No chapters detected yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Chapters will appear when the PDF is indexed.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Highlights */}
              {sidebarTab === 'highlights' && (
                <div className="space-y-2">
                  {highlights.length > 0 ? highlights.map((h) => (
                    <div key={h.id} className="rounded-md border border-border p-2 group">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={cn('h-3 w-3 rounded-full', HIGHLIGHT_COLORS.find(c => c.key === h.color)?.class ?? 'bg-yellow-400')} />
                        <span className="text-[10px] text-muted-foreground">Page {h.pageNumber}</span>
                        <button
                          onClick={() => handleDeleteHighlight(h.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs line-clamp-3">{h.selectedText}</p>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Highlighter className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No highlights yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Select text while reading to highlight.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {sidebarTab === 'notes' && (
                <div className="space-y-2">
                  {notes.length > 0 ? notes.map((n) => (
                    <div key={n.id} className="rounded-md border border-border p-2 group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium">{n.title}</span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{n.content}</p>
                      {n.pageNumber && <span className="text-[10px] text-muted-foreground">Page {n.pageNumber}</span>}
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <StickyNote className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No notes yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Press N or click the note icon to add one.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bookmarks */}
              {sidebarTab === 'bookmarks' && (
                <div className="space-y-1">
                  {bookmarks.length > 0 ? bookmarks.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setCurrentPage(b.pageNumber)}
                      className="flex w-full items-center gap-2 rounded-md border border-border p-2 text-left hover:bg-muted/30"
                    >
                      <Bookmark className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-medium">{b.title}</div>
                        <div className="text-[10px] text-muted-foreground">Page {b.pageNumber}</div>
                      </div>
                    </button>
                  )) : (
                    <div className="text-center py-8">
                      <Bookmark className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No bookmarks yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Press B to bookmark the current page.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Search */}
              {sidebarTab === 'search' && (
                <div>
                  <div className="relative mb-3">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search in book..."
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  {searchQuery.trim() ? (
                    <div className="space-y-2">
                      {/* Search highlights */}
                      {highlights.filter((h) => h.selectedText.toLowerCase().includes(searchQuery.toLowerCase())).map((h) => (
                        <button
                          key={h.id}
                          onClick={() => setCurrentPage(h.pageNumber)}
                          className="block w-full text-left rounded-md border border-border p-2 hover:bg-muted/30"
                        >
                          <span className="text-[10px] text-muted-foreground">Page {h.pageNumber} · Highlight</span>
                          <p className="text-xs line-clamp-2 mt-0.5">{h.selectedText}</p>
                        </button>
                      ))}
                      {/* Search notes */}
                      {notes.filter((n) => n.content.toLowerCase().includes(searchQuery.toLowerCase())).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => n.pageNumber && setCurrentPage(n.pageNumber)}
                          className="block w-full text-left rounded-md border border-border p-2 hover:bg-muted/30"
                        >
                          <span className="text-[10px] text-muted-foreground">Page {n.pageNumber ?? '?'} · Note</span>
                          <p className="text-xs line-clamp-2 mt-0.5">{n.content}</p>
                        </button>
                      ))}
                      {highlights.filter((h) => h.selectedText.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                       notes.filter((n) => n.content.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Type to search highlights and notes</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom mobile toolbar */}
      <div className={cn(
        'sm:hidden flex items-center justify-around border-t py-2',
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-card border-border'
      )}>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className={cn('h-9 w-9', isBookmarked && 'text-amber-500')} onClick={handleBookmark}>
          {isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowNoteDialog(true)}>
          <StickyNote className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <List className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Page {currentPage} of {book.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Title (optional)</Label>
              <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title..." />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Note</Label>
              <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write your note..." rows={4} autoFocus />
            </div>
            {selectedText && (
              <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <span className="font-medium">Selected text:</span> "{selectedText.substring(0, 100)}..."
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={!noteContent.trim()} className="gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reader Settings</DialogTitle>
            <DialogDescription>Customize your reading experience</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Theme</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={!darkMode ? 'default' : 'outline'} onClick={() => setDarkMode(false)} className="gap-1.5">
                  <Sun className="h-3.5 w-3.5" /> Light
                </Button>
                <Button size="sm" variant={darkMode ? 'default' : 'outline'} onClick={() => setDarkMode(true)} className="gap-1.5">
                  <Moon className="h-3.5 w-3.5" /> Dark
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Zoom: {zoom}%</Label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(50, z - 10))}><ZoomOut className="h-3.5 w-3.5" /></Button>
                <div className="flex-1 h-2 bg-muted rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${((zoom - 50) / 150) * 100}%` }} />
                </div>
                <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(200, z + 10))}><ZoomIn className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs mb-2 block">Keyboard Shortcuts</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">←</kbd> Previous page</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">→</kbd> Next page</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">B</kbd> Bookmark</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">N</kbd> Add note</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">F</kbd> Fullscreen</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">+</kbd> Zoom in</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">-</kbd> Zoom out</div>
                <div className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Esc</kbd> Close dialog</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
