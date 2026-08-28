'use client'

import * as React from 'react'
import {
  FileQuestion,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Bookmark,
  Lightbulb,
  Target,
  RotateCcw,
  Filter,
  Sparkles,
  Trophy,
  AlertCircle,
  Flag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { SourceBadge } from '@/components/shared/source-badge'
import { Breadcrumbs } from '@/components/shared/states'
import { toast } from 'sonner'

type Mode = 'practice' | 'exam' | 'revision' | 'weak'

const MODE_META: Record<Mode, { label: string; description: string; icon: React.ElementType; color: string }> = {
  practice: { label: 'Practice', description: 'Immediate feedback after each answer', icon: Target, color: 'from-emerald-500 to-teal-600' },
  exam: { label: 'Exam', description: 'No feedback until the end', icon: Trophy, color: 'from-violet-500 to-purple-600' },
  revision: { label: 'Revision', description: 'Reattempt previously incorrect questions', icon: RotateCcw, color: 'from-amber-500 to-orange-600' },
  weak: { label: 'Weak Areas', description: 'Focus on low-confidence topics', icon: AlertCircle, color: 'from-rose-500 to-pink-600' },
}

export function PracticeView() {
  const { viewParams, navigate } = useAppStore()
  const [mode, setMode] = React.useState<Mode>('practice')
  const [subject, setSubject] = React.useState<string>(viewParams.subject ?? 'all')
  const [difficulty, setDifficulty] = React.useState<string>('all')
  const [sourceType, setSourceType] = React.useState<string>(viewParams.sourceType ?? 'all')
  const [year, setYear] = React.useState<string>(viewParams.year ?? 'all')
  const [limit, setLimit] = React.useState<number>(10)
  const [subjects, setSubjects] = React.useState<any[]>([])

  const [questions, setQuestions] = React.useState<any[]>([])
  const [started, setStarted] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [selected, setSelected] = React.useState<string | null>(null)
  const [revealed, setRevealed] = React.useState(false)
  const [answers, setAnswers] = React.useState<Record<string, { selected: string; correct: boolean; explanation: string; correctAnswer: string }>>({})
  const [startTime, setStartTime] = React.useState<number>(0)
  const [questionStartTime, setQuestionStartTime] = React.useState<number>(0)
  const [completed, setCompleted] = React.useState(false)

  // If navigated from PYQ library with sourceType, auto-start
  React.useEffect(() => {
    if (viewParams.sourceType && viewParams.sourceType !== 'all') {
      setSourceType(viewParams.sourceType)
    }
  }, [viewParams.sourceType])

  React.useEffect(() => {
    api.subjects().then((r) => setSubjects(r.subjects))
  }, [])

  const startSession = async () => {
    setLoading(true)
    setStarted(true)
    setCompleted(false)
    setCurrentIdx(0)
    setSelected(null)
    setRevealed(false)
    setAnswers({})
    setStartTime(Date.now())
    setQuestionStartTime(Date.now())
    try {
      const params: any = { mode, limit }
      if (subject !== 'all') params.subject = subject
      if (difficulty !== 'all') params.difficulty = difficulty
      if (sourceType !== 'all') params.sourceType = sourceType
      if (year !== 'all') params.year = year
      const r = await api.questions(params)
      setQuestions(r.questions)
      if (r.questions.length === 0) {
        toast.error('No questions match these filters. Try broader filters.')
        setStarted(false)
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const resetSession = () => {
    setStarted(false)
    setCompleted(false)
    setQuestions([])
    setCurrentIdx(0)
    setSelected(null)
    setRevealed(false)
    setAnswers({})
  }

  const handleSelect = async (option: string) => {
    if (revealed && mode === 'practice') return
    setSelected(option)

    if (mode === 'practice') {
      // immediate reveal + record attempt
      try {
        const q = questions[currentIdx]
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
        const r = await api.attemptQuestion({
          questionId: q.id,
          selectedAnswer: option,
          timeSpentSec: timeSpent,
          mode: 'practice',
        })
        setRevealed(true)
        setAnswers((prev) => ({
          ...prev,
          [q.id]: {
            selected: option,
            correct: r.correct,
            explanation: r.explanation,
            correctAnswer: r.correctAnswer,
          },
        }))
      } catch (e: any) {
        toast.error('Failed to record answer')
      }
    } else {
      // exam mode: just store locally, no reveal
      const q = questions[currentIdx]
      setAnswers((prev) => ({
        ...prev,
        [q.id]: {
          selected: option,
          correct: option === q.correctAnswer,
          explanation: q.explanation,
          correctAnswer: q.correctAnswer,
        },
      }))
    }
  }

  const goNext = async () => {
    if (currentIdx + 1 >= questions.length) {
      // submit all (for exam mode, record attempts)
      if (mode === 'exam' || mode === 'revision' || mode === 'weak') {
        for (const q of questions) {
          const ans = answers[q.id]
          if (ans) {
            try {
              await api.attemptQuestion({
                questionId: q.id,
                selectedAnswer: ans.selected,
                mode,
              })
            } catch (e) {
              // ignore
            }
          }
        }
      }
      setCompleted(true)
      return
    }
    setCurrentIdx((i) => i + 1)
    setSelected(answers[questions[currentIdx + 1]?.id]?.selected ?? null)
    setRevealed(answers[questions[currentIdx + 1]?.id] != null && mode === 'practice')
    setQuestionStartTime(Date.now())
  }

  const goPrev = () => {
    if (currentIdx === 0) return
    setCurrentIdx((i) => i - 1)
    const prevQ = questions[currentIdx - 1]
    setSelected(answers[prevQ?.id]?.selected ?? null)
    setRevealed(answers[prevQ?.id] != null && mode === 'practice')
  }

  // Keyboard navigation (must be before early returns for hooks rules)
  React.useEffect(() => {
    if (!started || completed || loading) return
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      if (e.key === 'ArrowLeft' && currentIdx > 0) {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight' && selected) {
        e.preventDefault()
        goNext()
      } else if (['1', '2', '3', '4'].includes(e.key) && !revealed) {
        const opt = ['A', 'B', 'C', 'D'][parseInt(e.key) - 1]
        e.preventDefault()
        handleSelect(opt)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [started, completed, loading, currentIdx, selected, revealed])

  // Setup screen
  if (!started) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Breadcrumbs items={[
          { label: 'Home', onClick: () => navigate('home') },
          { label: 'Practice' },
        ]} />
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white">
              <FileQuestion className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">MCQ Practice</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose a mode, subject, difficulty and question count. Each question comes with a detailed explanation.
          </p>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">1. Select Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {(Object.keys(MODE_META) as Mode[]).map((m) => {
                const meta = MODE_META[m]
                const Icon = meta.icon
                const active = mode === m
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'group relative overflow-hidden rounded-lg border p-3 text-left transition-all',
                      active ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/40',
                    )}
                  >
                    <div className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br text-white mb-2', meta.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="font-semibold text-sm">{meta.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{meta.description}</div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">2. Configure Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Question Count</Label>
                <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v, 10))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button size="lg" onClick={startSession} disabled={loading} className="gap-2 w-full sm:w-auto">
          {loading ? (
            <>
              <RotateCcw className="h-4 w-4 animate-spin" /> Loading...
            </>
          ) : (
            <>
              <Target className="h-4 w-4" /> Start Practice
            </>
          )}
        </Button>
      </div>
    )
  }

  // Loading questions
  if (loading || questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Results screen
  if (completed) {
    const correctCount = Object.values(answers).filter((a) => a.correct).length
    const attemptedCount = Object.keys(answers).length
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0
    const totalTime = Math.round((Date.now() - startTime) / 1000)

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
              <Trophy className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">Practice Session Complete!</h1>
            <p className="text-sm text-muted-foreground mt-1">You answered {attemptedCount} of {questions.length} questions in {Math.floor(totalTime / 60)}m {totalTime % 60}s.</p>
            <div className="mt-5 grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="rounded-lg border border-border p-3">
                <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Correct</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-2xl font-bold text-rose-600">{attemptedCount - correctCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Incorrect</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-2xl font-bold">{accuracy}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</div>
              </div>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <Button onClick={resetSession} variant="outline" className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> New Session
              </Button>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-3">Question Review</h2>
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const ans = answers[q.id]
            return (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 mt-0.5',
                      ans?.correct ? 'bg-emerald-500/15 text-emerald-600' : ans ? 'bg-rose-500/15 text-rose-600' : 'bg-muted text-muted-foreground',
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{q.questionText}</div>
                      {ans ? (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={ans.correct ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                            {ans.selected} · {q[`option${ans.selected}`]}
                          </span>
                          {!ans.correct && (
                            <>
                              <span className="text-muted-foreground ml-2">| Correct: </span>
                              <span className="text-emerald-600 font-medium">{ans.correctAnswer} · {q[`option${ans.correctAnswer}`]}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-muted-foreground italic">Skipped</div>
                      )}
                      {ans && (
                        <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                          <Lightbulb className="h-3 w-3 inline mr-1 text-amber-500" />
                          {ans.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Question screen
  const q = questions[currentIdx]
  const ans = answers[q.id]
  const showFeedback = revealed && mode === 'practice'

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {/* Progress header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">{MODE_META[mode].label} mode</Badge>
            {q.sourceType && <SourceBadge sourceType={q.sourceType} />}
            <Badge variant="outline" className="text-[10px] capitalize">{q.difficulty}</Badge>
            {q.pyqYear && q.pyqYear > 0 && (
              <Badge variant="outline" className="text-[10px]">{q.pyqYear} {q.pyqSession}</Badge>
            )}
            {q.topic && (
              <Badge variant="outline" className="text-[10px]">{q.topic.name}</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Question <span className="font-semibold text-foreground">{currentIdx + 1}</span> / {questions.length}
          </div>
        </div>
        <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1" />
      </div>

      {/* Question card */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="text-lg font-medium leading-relaxed mb-5">{q.questionText}</div>
          <RadioGroup value={selected ?? ''} onValueChange={handleSelect} className="space-y-2">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const isCorrect = showFeedback && opt === q.correctAnswer
              const isSelected = selected === opt
              const isWrong = showFeedback && isSelected && !isCorrect
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={showFeedback}
                  aria-label={`Option ${opt}: ${q[`option${opt}`]}${isSelected ? ' (selected)' : ''}`}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all',
                    !showFeedback && 'hover:border-primary/40 hover:bg-muted/30',
                    showFeedback && isCorrect && 'border-emerald-500 bg-emerald-500/5',
                    showFeedback && isWrong && 'border-rose-500 bg-rose-500/5',
                    !showFeedback && isSelected && 'border-primary bg-primary/5',
                    !showFeedback && !isSelected && 'border-border',
                  )}
                >
                  <div className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                    !showFeedback && isSelected && 'bg-primary text-primary-foreground',
                    !showFeedback && !isSelected && 'bg-muted text-muted-foreground',
                    showFeedback && isCorrect && 'bg-emerald-500 text-white',
                    showFeedback && isWrong && 'bg-rose-500 text-white',
                    showFeedback && !isCorrect && !isWrong && 'bg-muted text-muted-foreground',
                  )}>
                    {showFeedback && isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : showFeedback && isWrong ? <XCircle className="h-3.5 w-3.5" /> : opt}
                  </div>
                  <span className="flex-1 pt-0.5">{q[`option${opt}`]}</span>
                </button>
              )
            })}
          </RadioGroup>

          {/* Feedback */}
          {showFeedback && (
            <div className={cn(
              'mt-4 rounded-lg border p-4',
              ans?.correct ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5',
            )}>
              <div className="flex items-center gap-2 mb-2">
                {ans?.correct ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )}
                <span className={cn('font-semibold text-sm', ans?.correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
                  {ans?.correct ? 'Correct!' : `Incorrect — correct answer is ${ans?.correctAnswer}`}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3 inline mr-1 text-amber-500" />
                {ans?.explanation}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIdx === 0} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Previous
        </Button>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">1-4</kbd>
          <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">→</kbd>
        </div>
        <div className="flex items-center gap-2">
          <ReportButton questionId={q.id} />
          <BookmarkButton itemType="question" itemId={q.id} showLabel={false} variant="ghost" />
          <Button onClick={goNext} disabled={!selected} className="gap-1.5">
            {currentIdx + 1 >= questions.length ? 'Finish' : 'Next'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ReportButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = React.useState(false)
  const [issueType, setIssueType] = React.useState('wrong-answer')
  const [description, setDescription] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.createReport({
        itemType: 'question',
        itemId: questionId,
        issueType,
        description: description.trim() || undefined,
      })
      toast.success('Report submitted. Thank you!')
      setOpen(false)
      setDescription('')
      setIssueType('wrong-answer')
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-muted-foreground">
        <Flag className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Report</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this question</DialogTitle>
            <DialogDescription>
              Help us improve the platform. Reports are reviewed by our content team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Issue type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wrong-answer">Wrong answer</SelectItem>
                  <SelectItem value="incorrect-explanation">Incorrect explanation</SelectItem>
                  <SelectItem value="outdated-info">Outdated information</SelectItem>
                  <SelectItem value="typo">Typo / formatting</SelectItem>
                  <SelectItem value="duplicate">Duplicate question</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the issue..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
