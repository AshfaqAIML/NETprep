'use client'

import * as React from 'react'
import {
  Bookmark,
  FolderOpen,
  Trash2,
  ArrowRight,
  BookOpen,
  FileQuestion,
  Sparkles,
  Timer,
  PenTool,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const FOLDERS = ['Favorites', 'Important', 'Revise Later', 'Weak Topics', 'Exam Week']
const ICONS: Record<string, React.ElementType> = {
  note: PenTool,
  question: FileQuestion,
  cheatsheet: Sparkles,
  book: BookOpen,
  mocktest: Timer,
}

export function BookmarksView() {
  const navigate = useAppStore((s) => s.navigate)
  const [bookmarks, setBookmarks] = React.useState<any[]>([])
  const [folder, setFolder] = React.useState<string>('Favorites')
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    api.bookmarks(folder)
      .then((r) => setBookmarks(r.bookmarks))
      .finally(() => setLoading(false))
  }, [folder])

  React.useEffect(() => {
    load()
  }, [load])

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Bookmark removed')
        setBookmarks((prev) => prev.filter((b) => b.id !== id))
      }
    } catch (e) {
      toast.error('Failed to remove bookmark')
    }
  }

  const handleOpen = (b: any) => {
    if (b.itemType === 'note') navigate('note-reader', { slug: b.item.slug })
    else if (b.itemType === 'cheatsheet') navigate('cheat-sheet-reader', { slug: b.item.slug })
    else if (b.itemType === 'book') navigate('books', { highlightSlug: b.item.slug })
    else if (b.itemType === 'mocktest') navigate('mock-test-runner', { slug: b.item.slug })
    else if (b.itemType === 'question') navigate('practice')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Bookmark className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Save important questions, notes, cheat sheets and books for quick revision. Organise them into folders.
        </p>
      </div>

      <Tabs value={folder} onValueChange={setFolder} className="mb-5">
        <TabsList className="flex-wrap h-auto">
          {FOLDERS.map((f) => (
            <TabsTrigger key={f} value={f} className="gap-1.5">
              <FolderOpen className="h-3 w-3" />
              {f}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No bookmarks in {folder} yet</p>
          <p className="text-sm text-muted-foreground mb-4">Save important resources here for quick revision.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('notes')} className="gap-1.5">
            Browse Notes <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bookmarks.map((b) => {
            const Icon = ICONS[b.itemType] ?? Bookmark
            const item = b.item
            if (!item) return null
            return (
              <Card key={b.id} className="group relative overflow-hidden transition-all hover:border-primary/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{b.itemType}</Badge>
                      </div>
                      <button onClick={() => handleOpen(b)} className="block w-full text-left">
                        <div className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title ?? item.questionText ?? 'Untitled'}
                        </div>
                        {item.excerpt && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.excerpt}</div>
                        )}
                        {item.author && (
                          <div className="text-xs text-muted-foreground mt-1">{item.author}</div>
                        )}
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-500"
                      onClick={() => handleRemove(b.id)}
                      aria-label="Remove bookmark"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {b.note && (
                    <div className="mt-2 text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                      {b.note}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
