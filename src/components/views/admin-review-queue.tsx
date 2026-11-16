'use client'

import * as React from 'react'
import {
  ClipboardCheck,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ReviewQueue() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState('review')
  const [unit, setUnit] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    const params: any = { status, limit: 500 }
    if (unit !== 'all') params.unit = unit
    if (search.trim()) params.search = search.trim()
    api.adminReviewQueue(params)
      .then((r) => {
        setData(r)
        setSelected(new Set())
      })
      .catch(() => toast.error('Failed to load review queue'))
      .finally(() => setLoading(false))
  }, [status, unit, search])

  React.useEffect(() => { load() }, [load])

  const questions: any[] = data?.questions ?? []
  const counts = data?.counts ?? {}

  const unitOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const u of data?.units ?? []) if (u.unit) set.add(u.unit)
    for (const q of questions) if (q.syllabusUnit) set.add(q.syllabusUnit)
    return Array.from(set).sort()
  }, [data, questions])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === questions.length) setSelected(new Set())
    else setSelected(new Set(questions.map((q: any) => q.id)))
  }

  const act = async (action: 'approve' | 'reject' | 'reset') => {
    if (selected.size === 0) {
      toast.error('Select at least one question')
      return
    }
    setBusy(true)
    try {
      const result = await api.adminReviewQuestions({
        ids: Array.from(selected),
        action,
        notes: notes.trim() || undefined,
      })
      toast.success(
        `${result.updated} question(s) ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned to review'}`,
      )
      setNotes('')
      load()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update review queue')
    } finally {
      setBusy(false)
    }
  }

  const needsVerification = (q: any) => {
    if (q.verificationData) return false
    if (q.presentationType === 'code' || q.presentationType === 'mathematical') return true
    const tags = String(q.tags ?? '').toLowerCase()
    return ['calculation', 'sql', 'automata', 'dfa', 'graph', 'circuit', 'boolean'].some((t) =>
      tags.includes(t),
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Generated Question Review Queue
            <Badge variant="outline" className="text-[10px]">
              {counts.review ?? 0} review · {counts.published ?? 0} published · {counts.rejected ?? 0} rejected
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Review ({counts.review ?? 0})</SelectItem>
              <SelectItem value="published">Published ({counts.published ?? 0})</SelectItem>
              <SelectItem value="rejected">Rejected ({counts.rejected ?? 0})</SelectItem>
              <SelectItem value="archived">Archived ({counts.archived ?? 0})</SelectItem>
            </SelectContent>
          </Select>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="All units" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All units</SelectItem>
              {unitOptions.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, text or tags..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={questions.length > 0 && selected.size === questions.length}
              onChange={toggleAll}
              className="h-4 w-4"
            />
            Select all ({selected.size}/{questions.length})
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Review notes (optional)"
            className="max-w-sm"
          />
          <Button size="sm" onClick={() => act('approve')} disabled={busy || selected.size === 0} className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => act('reject')} disabled={busy || selected.size === 0} className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" /> Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => act('reset')} disabled={busy || selected.size === 0} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Reset to review
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium">No questions in this view</p>
            <p className="text-sm text-muted-foreground">Adjust filters or import the bank.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[720px] overflow-y-auto scrollbar-thin">
            {questions.map((q: any) => {
              const isOpen = expanded === q.id
              const missingVerification = needsVerification(q)
              return (
                <div key={q.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(q.id)}
                      onChange={() => toggle(q.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-semibold">{q.questionCode || q.id}</span>
                        <Badge variant="outline" className="text-[9px]">{q.syllabusUnit}</Badge>
                        <Badge variant="outline" className="text-[9px]">{q.batch}</Badge>
                        <Badge variant="outline" className="text-[9px] capitalize">{q.difficulty}</Badge>
                        <Badge variant="outline" className="text-[9px]">{q.cognitiveSkill}</Badge>
                        <Badge variant="outline" className="text-[9px]">{q.presentationType}</Badge>
                        {missingVerification && (
                          <Badge variant="destructive" className="text-[9px]">Needs verification</Badge>
                        )}
                        {q.verificationData && (
                          <Badge variant="secondary" className="text-[9px]">Verified metadata</Badge>
                        )}
                      </div>
                      <div className="text-sm font-medium line-clamp-2">{q.questionText}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Topic: {q.topic?.name ?? q.topicId} · Answer: <span className="font-semibold text-foreground">{q.correctAnswer}</span>
                        {q.verified ? ' · ✓ Published' : ''}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setExpanded(isOpen ? null : q.id)}
                      aria-label="Expand"
                    >
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      <div>
                        <div className="text-xs font-semibold mb-1">Options</div>
                        <div className="space-y-1 text-sm">
                          {(['A', 'B', 'C', 'D'] as const).map((key) => (
                            <div
                              key={key}
                              className={cn(
                                'rounded px-2 py-1',
                                q.correctAnswer === key
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium'
                                  : 'text-muted-foreground',
                              )}
                            >
                              <span className="font-semibold mr-1">{key}.</span>
                              {q[`option${key}`]}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold mb-1">Explanation</div>
                        <p className="text-sm whitespace-pre-wrap">{q.explanation}</p>
                      </div>
                      {q.passage && (
                        <div>
                          <div className="text-xs font-semibold mb-1">Passage</div>
                          <p className="text-sm whitespace-pre-wrap">{q.passage}</p>
                        </div>
                      )}
                      {q.tableMarkdown && (
                        <div>
                          <div className="text-xs font-semibold mb-1">Table</div>
                          <pre className="text-xs whitespace-pre-wrap bg-muted/30 rounded p-2">{q.tableMarkdown}</pre>
                        </div>
                      )}
                      {q.codeSnippet && (
                        <div>
                          <div className="text-xs font-semibold mb-1">Code</div>
                          <pre className="text-xs whitespace-pre-wrap bg-muted/30 rounded p-2">{q.codeSnippet}</pre>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">Provenance:</span> {q.provenance}
                      </div>
                      {q.verificationData && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-semibold">Verification metadata</summary>
                          <pre className="mt-1 whitespace-pre-wrap bg-muted/30 rounded p-2 max-h-48 overflow-auto">
                            {q.verificationData}
                          </pre>
                        </details>
                      )}
                      {q.reviewNotes && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">Review notes:</span> {q.reviewNotes}
                        </div>
                      )}
                      {q.reviewedBy && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">Reviewed by:</span> {q.reviewedBy}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
