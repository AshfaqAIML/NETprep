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
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.note(slug)
      .then((r) => {
        setNote(r.note)
        setRelated(r.related)
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

      {/* Content */}
      <Markdown content={note.content} />

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

      {/* Related */}
      {related.length > 0 && (
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
