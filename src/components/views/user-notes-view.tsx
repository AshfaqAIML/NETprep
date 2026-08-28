'use client'

import * as React from 'react'
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Save,
  X,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Markdown } from '@/components/shared/markdown'

const COLORS = [
  { key: 'default', class: 'bg-muted border-border' },
  { key: 'yellow', class: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'green', class: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'blue', class: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'pink', class: 'bg-rose-500/10 border-rose-500/30' },
  { key: 'purple', class: 'bg-violet-500/10 border-violet-500/30' },
]

export function UserNotesView() {
  const [notes, setNotes] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [editing, setEditing] = React.useState<any>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    api.userNotes()
      .then((r) => setNotes(r.notes))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(query.toLowerCase()) ||
    (n.content ?? '').toLowerCase().includes(query.toLowerCase()) ||
    (n.tags ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  const handleSave = async (data: any) => {
    try {
      if (editing?.id) {
        await api.updateUserNote({ id: editing.id, ...data })
        toast.success('Note updated')
      } else {
        await api.createUserNote(data)
        toast.success('Note created')
      }
      setDialogOpen(false)
      setEditing(null)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save note')
    }
  }

  const handleDelete = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try {
      await api.deleteUserNote(id)
      toast.success('Note deleted')
    } catch (e) {
      load()
      toast.error('Failed to delete')
    }
  }

  const togglePin = async (note: any) => {
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, pinned: !n.pinned } : n))
    try {
      await api.updateUserNote({ id: note.id, pinned: !note.pinned })
    } catch (e) {
      load()
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <StickyNote className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Create private notes — jot down key points, formulas, mnemonics, or anything you want to remember.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Note</span>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your notes..."
          className="pl-9"
        />
      </div>

      {/* Notes grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">{query ? 'No notes match your search' : 'No notes yet'}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {query ? 'Try a different search term.' : 'Create your first note to start capturing important concepts.'}
          </p>
          {!query && (
            <Button variant="outline" size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Create Note
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note) => {
            const colorMeta = COLORS.find((c) => c.key === note.color) ?? COLORS[0]
            return (
              <Card
                key={note.id}
                className={cn('group relative overflow-hidden transition-all hover:shadow-md', colorMeta.class)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <button
                      onClick={() => togglePin(note)}
                      className={cn('shrink-0 mt-0.5', note.pinned ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-muted-foreground')}
                      aria-label={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      {note.pinned ? <Pin className="h-3.5 w-3.5 fill-amber-500" /> : <PinOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => { setEditing(note); setDialogOpen(true) }}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="font-semibold text-sm line-clamp-2">{note.title}</div>
                    </button>
                  </div>
                  {note.content && (
                    <button
                      onClick={() => { setEditing(note); setDialogOpen(true) }}
                      className="block w-full text-left"
                    >
                      <div className="text-xs text-muted-foreground line-clamp-6 mb-2">
                        {note.content}
                      </div>
                    </button>
                  )}
                  {note.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.split(',').filter(Boolean).slice(0, 3).map((t: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[9px]">{t.trim()}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDelete(note.id)}
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Editor dialog */}
      <NoteDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null) }}
        note={editing}
        onSave={handleSave}
      />
    </div>
  )
}

function NoteDialog({ open, onOpenChange, note, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; note: any; onSave: (data: any) => void }) {
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [tags, setTags] = React.useState('')
  const [color, setColor] = React.useState('default')

  React.useEffect(() => {
    if (note) {
      setTitle(note.title ?? '')
      setContent(note.content ?? '')
      setTags(note.tags ?? '')
      setColor(note.color ?? 'default')
    } else {
      setTitle('')
      setContent('')
      setTags('')
      setColor('default')
    }
  }, [note, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'New Note'}</DialogTitle>
          <DialogDescription>
            Use markdown for formatting. Notes are private — only you can see them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 flex-1 overflow-y-auto">
          <div>
            <Label className="text-xs mb-1.5 block">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Research Aptitude — Key Formulas"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Content (Markdown supported)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here...&#10;&#10;## Key Points&#10;- Point 1&#10;- Point 2&#10;&#10;**Formula:** X = Y + Z"
              rows={10}
              className="font-mono text-xs"
            />
          </div>
          {content && (
            <div>
              <Label className="text-xs mb-1.5 block">Preview</Label>
              <div className="rounded-md border border-border p-3 max-h-40 overflow-y-auto">
                <Markdown content={content} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="research, formulas, important"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Color</Label>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setColor(c.key)}
                    className={cn(
                      'h-7 w-7 rounded-md border-2 transition-all',
                      c.class,
                      color === c.key ? 'ring-2 ring-primary ring-offset-1 scale-110' : '',
                    )}
                    aria-label={c.key}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button onClick={() => onSave({ title, content, tags, color })} disabled={!title.trim()} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
