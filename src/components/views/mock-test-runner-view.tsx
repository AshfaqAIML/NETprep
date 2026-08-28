'use client'

import * as React from 'react'
import {
  ArrowLeft,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Send,
  Bookmark,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  unanswered: 'bg-muted text-muted-foreground hover:bg-muted/80',
  answered: 'bg-emerald-500 text-white hover:bg-emerald-600',
  marked: 'bg-amber-500 text-white hover:bg-amber-600',
  'marked-answered': 'bg-purple-500 text-white hover:bg-purple-600',
  'not-visited': 'bg-background border border-border text-muted-foreground hover:bg-muted',
}

export function MockTestRunnerView() {
  const { viewParams, navigate } = useAppStore()
  const slug = viewParams.slug as string

  const [mockTest, setMockTest] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [marked, setMarked] = React.useState<Set<string>>(new Set())
  const [visited, setVisited] = React.useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)
  const [startTime, setStartTime] = React.useState<number>(0)

  React.useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.mockTest(slug)
      .then((r) => {
        setMockTest(r.mockTest)
        setTimeLeft(r.mockTest.durationMin * 60)
        setStartTime(Date.now())
        // mark first question visited
        if (r.mockTest.questions[0]) {
          setVisited(new Set([r.mockTest.questions[0].question.id]))
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  // countdown
  React.useEffect(() => {
    if (!mockTest || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t)
          handleSubmit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [mockTest])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!mockTest) return <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">Mock test not found.</div>

  const questions = mockTest.questions
  const currentQ = questions[currentIdx]?.question
  if (!currentQ) return <div>No questions in this mock test.</div>

  const answeredCount = Object.keys(answers).length
  const markedCount = marked.size
  const unansweredCount = questions.length - answeredCount

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`
  }

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return
    setCurrentIdx(idx)
    setVisited((prev) => new Set(prev).add(questions[idx].question.id))
  }

  const selectOption = (opt: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))
  }

  const clearAnswer = () => {
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[currentQ.id]
      return next
    })
  }

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(currentQ.id)) next.delete(currentQ.id)
      else next.add(currentQ.id)
      return next
    })
  }

  const getQuestionStatus = (qId: string) => {
    const isAnswered = !!answers[qId]
    const isMarked = marked.has(qId)
    if (isMarked && isAnswered) return 'marked-answered'
    if (isMarked) return 'marked'
    if (isAnswered) return 'answered'
    if (visited.has(qId)) return 'unanswered'
    return 'not-visited'
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      const result = await api.submitMock({
        mockTestId: mockTest.id,
        answers,
        timeSpentSec: timeSpent,
      })
      toast.success('Mock test submitted!')
      navigate('mock-test-result', { result, mockTestTitle: mockTest.title })
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit mock test')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      {/* Header bar */}
      <div className="sticky top-16 z-30 mb-4 rounded-lg border border-border bg-background/95 backdrop-blur p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate('mock-tests')} className="gap-1 shrink-0">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{mockTest.title}</div>
              <div className="text-[10px] text-muted-foreground">
                {answeredCount} answered · {unansweredCount} left · {markedCount} marked
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm font-semibold',
              timeLeft < 60 ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-foreground',
            )}>
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={submitting} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Submit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit mock test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {answeredCount} of {questions.length} questions.
                    {unansweredCount > 0 && ` ${unansweredCount} unanswered questions will be marked as skipped.`}
                    {' '}This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Test</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="h-1 mt-2" />
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        {/* Question */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Q {currentIdx + 1} / {questions.length}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{currentQ.difficulty}</Badge>
                {currentQ.topic && (
                  <Badge variant="outline" className="text-[10px]">{currentQ.topic.name}</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={toggleMark} className={cn('gap-1.5', marked.has(currentQ.id) && 'text-amber-600')}>
                <Flag className="h-3.5 w-3.5" />
                {marked.has(currentQ.id) ? 'Marked' : 'Mark'}
              </Button>
            </div>

            <div className="text-base font-medium leading-relaxed mb-5">{currentQ.questionText}</div>

            <div className="space-y-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const isSelected = answers[currentQ.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => selectOption(opt)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all',
                      isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-muted/30',
                    )}
                  >
                    <div className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}>
                      {opt}
                    </div>
                    <span className="flex-1 pt-0.5">{currentQ[`option${opt}`]}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={clearAnswer} className="gap-1.5">
                Clear response
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0} className="gap-1.5">
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button size="sm" onClick={() => goTo(currentIdx + 1)} disabled={currentIdx + 1 >= questions.length} className="gap-1.5">
                  Save & Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question palette */}
        <Card className="lg:sticky lg:top-32 self-start">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Question Palette</div>
            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 gap-1.5 mb-4">
              {questions.map((mtq: any, idx: number) => {
                const status = getQuestionStatus(mtq.question.id)
                return (
                  <button
                    key={mtq.id}
                    onClick={() => goTo(idx)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors',
                      STATUS_COLORS[status],
                      idx === currentIdx && 'ring-2 ring-primary ring-offset-1',
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="space-y-1 text-[10px]">
              <LegendItem color="bg-emerald-500" label={`Answered (${answeredCount})`} />
              <LegendItem color="bg-amber-500" label={`Marked (${markedCount})`} />
              <LegendItem color="bg-muted border border-border" label={`Not Answered (${unansweredCount})`} />
              <LegendItem color="bg-purple-500" label={`Marked & Answered`} />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="default" className="w-full mt-4 gap-1.5" disabled={submitting}>
                  <Send className="h-3.5 w-3.5" />
                  Submit Test
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit mock test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {answeredCount} of {questions.length} questions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Test</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} disabled={submitting}>Submit Test</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-3 w-3 rounded', color)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
