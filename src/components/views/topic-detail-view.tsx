'use client'

import * as React from 'react'
import {
  ArrowLeft,
  BookOpen,
  PenTool,
  Sparkles,
  FileQuestion,
  FileText,
  ChevronRight,
  ChevronLeft,
  Target,
  Circle,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  StickyNote,
  Plus,
  Lightbulb,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string; next: string }> = {
  'not-started': { label: 'Not Started', icon: Circle, color: 'text-muted-foreground', next: 'Start Studying' },
  'studying': { label: 'Studying', icon: CircleDot, color: 'text-amber-500', next: 'Mark as Completed' },
  'completed': { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', next: 'Needs Revision?' },
  'needs-revision': { label: 'Needs Revision', icon: AlertCircle, color: 'text-rose-500', next: 'Mark as Completed' },
}

export function TopicDetailView() {
  const { viewParams, navigate } = useAppStore()
  const topicId = viewParams.topicId as string
  const subjectSlug = viewParams.subjectSlug as string

  const [subject, setSubject] = React.useState<any>(null)
  const [topic, setTopic] = React.useState<any>(null)
  const [notes, setNotes] = React.useState<any[]>([])
  const [usesFallbackNotes, setUsesFallbackNotes] = React.useState(false)
  const [cheatSheets, setCheatSheets] = React.useState<any[]>([])
  const [questions, setQuestions] = React.useState<any[]>([])
  const [pyqs, setPyqs] = React.useState<any[]>([])
  const [relatedTopics, setRelatedTopics] = React.useState<any[]>([])
  const [progress, setProgress] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!subjectSlug) return
    setLoading(true)
    api.subject(subjectSlug)
      .then((r) => {
        setSubject(r.subject)
        const t = r.subject.units.flatMap((u: any) => u.topics).find((t: any) => t.id === topicId)
        setTopic(t)
        setProgress(t?.progress ?? null)

        // Find related topics (same unit, different topic)
        if (t) {
          const unit = r.subject.units.find((u: any) => u.id === t.unitId)
          if (unit) {
            setRelatedTopics(unit.topics.filter((rt: any) => rt.id !== topicId).slice(0, 4))
          }
        }

        return Promise.all([
          api.notes({ topicId }),
          api.questions({ topicId, limit: 10 }),
          api.pyqs({ subject: subjectSlug }),
          api.cheatSheets(),
          api.notes({ subjectId: r.subject.id }),
        ])
      })
      .then(([n, q, p, cs, s]) => {
        setQuestions(q.questions)
        // Filter PYQs for this topic
        setPyqs((p.pyqQuestions || []).filter((pyq: any) => pyq.topicId === topicId))
        setCheatSheets(cs.cheatSheets.filter((c: any) => c.topicId === topicId))
        // Use topic-specific notes; fall back to the subject's full-book notes
        // (whole-book imports live at subject level, so topics inherit them).
        const topicNotes = n.notes ?? []
        if (topicNotes.length > 0) {
          setNotes(topicNotes)
          setUsesFallbackNotes(false)
        } else {
          setNotes((s.notes ?? []).filter((nn: any) => !nn.topicId))
          setUsesFallbackNotes(true)
        }
      })
      .finally(() => setLoading(false))
  }, [topicId, subjectSlug])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!topic || !subject) return <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">Topic not found.</div>

  const status = progress?.status ?? 'not-started'
  const meta = STATUS_META[status]
  const Icon = meta.icon

  const cycleStatus = async () => {
    const next: Record<string, string> = {
      'not-started': 'studying',
      'studying': 'completed',
      'completed': 'needs-revision',
      'needs-revision': 'completed',
    }
    const newStatus = next[status]
    const newConfidence = newStatus === 'completed' ? 80 : newStatus === 'needs-revision' ? 40 : 50
    try {
      const r = await api.updateTopicProgress({ topicId, status: newStatus, confidence: newConfidence })
      setProgress(r.progress)
      toast.success(`Marked as ${newStatus.replace('-', ' ')}`)
    } catch (e: any) {
      toast.error('Failed to update progress')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4 flex-wrap">
        <button onClick={() => navigate('subjects')} className="hover:text-foreground">Subjects</button>
        <ChevronRight className="h-3 w-3" />
        <button onClick={() => navigate('subject-detail', { slug: subject.slug })} className="hover:text-foreground">{subject.name}</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{topic.name}</span>
      </nav>

      {/* Topic header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{subject.name}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{topic.importance} importance</Badge>
                <Badge variant={meta.color.includes('emerald') ? 'default' : meta.color.includes('rose') ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                  {meta.label}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{topic.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{topic.description ?? 'Core topic for UGC NET preparation.'}</p>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Button onClick={cycleStatus} variant="outline" size="sm" className={cn('gap-1.5', meta.color)}>
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label} · {meta.next}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('user-notes', { topicId })}
                  className="gap-1.5"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning loop: Learn → Practice → Revise → Test */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Learn: Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PenTool className="h-4 w-4 text-primary" />
              Learn · Detailed Notes
              <Badge variant="outline" className="ml-auto text-[10px]">{notes.length}{usesFallbackNotes ? ' book' : ''}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usesFallbackNotes && (
              <p className="text-[11px] text-muted-foreground mb-3">No topic-specific notes yet — these full-book notes cover this unit's chapters.</p>
            )}
            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => navigate('note-reader', { slug: n.slug })}
                    className="block w-full text-left rounded-md border border-border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <PenTool className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground">{n.readingTime} min read</span>
                      <Badge variant="outline" className="text-[9px] capitalize ml-auto">{n.difficulty}</Badge>
                    </div>
                    <div className="font-medium text-sm line-clamp-2">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.excerpt}</div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyHint icon={PenTool} text="No detailed notes for this topic yet." />
            )}
          </CardContent>
        </Card>

        {/* Revise: Cheat Sheets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-500" />
              Revise · Cheat Sheets
              <Badge variant="outline" className="ml-auto text-[10px]">{cheatSheets.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cheatSheets.length > 0 ? (
              <div className="space-y-2">
                {cheatSheets.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate('cheat-sheet-reader', { slug: c.slug })}
                    className="block w-full text-left rounded-md border border-border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                      <span className="text-[10px] text-muted-foreground">Quick revision</span>
                    </div>
                    <div className="font-medium text-sm line-clamp-1">{c.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.summary}</div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyHint icon={Sparkles} text="No cheat sheets for this topic yet." />
            )}
          </CardContent>
        </Card>

        {/* Practice: MCQs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-violet-500" />
              Practice · MCQs
              <Badge variant="outline" className="ml-auto text-[10px]">{questions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <div className="space-y-2">
                {questions.slice(0, 3).map((q) => (
                  <div key={q.id} className="rounded-md border border-border p-3 text-xs">
                    <div className="font-medium line-clamp-2">{q.questionText}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px] capitalize">{q.difficulty}</Badge>
                      {q.isPYQ && <Badge variant="secondary" className="text-[9px]">PYQ {q.pyqYear}</Badge>}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('practice', { topicId })}
                  className="w-full mt-2 gap-1.5"
                >
                  <Target className="h-3.5 w-3.5" />
                  Start {questions.length}-question practice
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <EmptyHint icon={FileQuestion} text="No practice questions for this topic yet." />
            )}
          </CardContent>
        </Card>

        {/* PYQs + Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              Past Questions & Test
              {pyqs.length > 0 && <Badge variant="outline" className="ml-auto text-[10px]">{pyqs.length} PYQs</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pyqs.slice(0, 2).map((pyq: any) => (
                <div key={pyq.id} className="rounded-md border border-border p-3 text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <Badge variant="secondary" className="text-[9px]">{pyq.pyqYear}</Badge>
                    {pyq.source && <span className="text-[10px] text-muted-foreground">{pyq.source}</span>}
                  </div>
                  <div className="font-medium line-clamp-2">{pyq.questionText}</div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('pyqs', { subject: subject.slug })}
                className="w-full justify-start gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                View All PYQs
                <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('mock-tests', { subject: subject.slug })}
                className="w-full justify-start gap-1.5"
              >
                <Target className="h-3.5 w-3.5" />
                Take a Mock Test
                <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related topics */}
      {relatedTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Related Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              {relatedTopics.map((rt: any) => (
                <button
                  key={rt.id}
                  onClick={() => navigate('topic-detail', { topicId: rt.id, subjectSlug: subject.slug })}
                  className="flex items-center gap-2 rounded-md border border-border p-3 text-left hover:border-primary/40 hover:bg-muted/30 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-1">{rt.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{rt.importance} importance</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study tip */}
      <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Study tip</p>
            <p className="text-xs text-muted-foreground mt-1">
              Read the notes first, then attempt the practice questions. If your accuracy is below 60%, review the cheat sheet and reattempt. Mark this topic as completed only when you can consistently answer 75%+ correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyHint({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-4">
      <Icon className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  )
}
