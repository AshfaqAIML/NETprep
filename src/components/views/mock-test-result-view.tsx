'use client'

import * as React from 'react'
import {
  Trophy,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  CircleDashed,
  TrendingUp,
  ArrowLeft,
  Lightbulb,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAppStore } from '@/lib/store'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

export function MockTestResultView() {
  const { viewParams, navigate } = useAppStore()
  const result = viewParams.result
  const mockTestTitle = (viewParams.mockTestTitle as string) ?? 'Mock Test'

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 text-center">
        <p>No result to display.</p>
        <Button onClick={() => navigate('mock-tests')} className="mt-4">Back to Mock Tests</Button>
      </div>
    )
  }

  const { total, correct, incorrect, skipped, score, percentage, accuracy, timeSpentSec, topicWise = [], questions = [] } = result

  const minutes = Math.floor(timeSpentSec / 60)
  const seconds = timeSpentSec % 60
  const avgTime = total > 0 ? Math.round(timeSpentSec / total) : 0

  const chartData = topicWise.map((t: any) => ({
    name: t.topicName,
    accuracy: Math.round((t.correct / t.total) * 100),
  }))

  const weakest = [...topicWise].sort((a: any, b: any) => a.correct / a.total - b.correct / b.total)[0]

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('mock-tests')} className="mb-4 gap-1 text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Mock Tests
      </Button>

      {/* Score header */}
      <Card className="mb-6 overflow-hidden">
        <div className="absolute" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Trophy className="h-12 w-12" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Test Complete!</h1>
              <p className="text-sm text-muted-foreground mt-1">{mockTestTitle}</p>
              <div className="mt-3 flex flex-wrap gap-4 justify-center sm:justify-start text-sm">
                <div>
                  <span className="text-muted-foreground">Score: </span>
                  <span className="font-bold text-emerald-600 text-lg">{score}</span>
                  <span className="text-muted-foreground">/{total * 2}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Percentage: </span>
                  <span className="font-bold">{percentage}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox icon={CheckCircle2} label="Correct" value={correct} color="text-emerald-600" bg="bg-emerald-500/10" />
            <StatBox icon={XCircle} label="Incorrect" value={incorrect} color="text-rose-600" bg="bg-rose-500/10" />
            <StatBox icon={CircleDashed} label="Skipped" value={skipped} color="text-amber-600" bg="bg-amber-500/10" />
            <StatBox icon={Clock} label="Time" value={`${minutes}m ${seconds}s`} color="text-violet-600" bg="bg-violet-500/10" />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricBar label="Accuracy" value={accuracy} color="bg-emerald-500" />
            <MetricBar label="Attempted" value={Math.round(((correct + incorrect) / total) * 100)} color="bg-violet-500" />
            <MetricBar label="Completion" value={Math.round(((total - skipped) / total) * 100)} color="bg-amber-500" />
          </div>
        </CardContent>
      </Card>

      {/* Topic-wise breakdown */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Accuracy by Topic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry: any, idx: number) => (
                      <Cell
                        key={idx}
                        fill={entry.accuracy >= 75 ? '#10b981' : entry.accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendation */}
            {weakest && (
              <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">Recommended next step</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your weakest area is <strong className="text-foreground">{weakest.topicName}</strong> ({Math.round((weakest.correct / weakest.total) * 100)}% accuracy).
                  Revise this topic, read its notes, then attempt 10–15 targeted practice questions.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-1.5"
                  onClick={() => navigate('practice', { mode: 'weak' })}
                >
                  <Target className="h-3.5 w-3.5" />
                  Practice Weak Areas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question-by-question review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {questions.map((q: any, idx: number) => (
              <AccordionItem key={q.questionId} value={q.questionId} className="border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 pr-3 text-left">
                    <div className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      q.isCorrect ? 'bg-emerald-500/15 text-emerald-600' : q.wasSkipped ? 'bg-amber-500/15 text-amber-600' : 'bg-rose-500/15 text-rose-600',
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-1">{q.questionText}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {q.isCorrect ? 'Correct' : q.wasSkipped ? 'Skipped' : 'Incorrect'}
                        {q.topic && ` · ${q.topic}`}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-1.5 mb-3">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const isCorrect = opt === q.correctAnswer
                      const isSelected = opt === q.selectedAnswer
                      return (
                        <div
                          key={opt}
                          className={cn(
                            'flex items-start gap-2 rounded-md border px-3 py-1.5 text-xs',
                            isCorrect ? 'border-emerald-500 bg-emerald-500/5' : isSelected ? 'border-rose-500 bg-rose-500/5' : 'border-border',
                          )}
                        >
                          <span className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-semibold mt-0.5',
                            isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground',
                          )}>
                            {isCorrect ? '✓' : isSelected ? '✗' : opt}
                          </span>
                          <span className="flex-1">{q.options[opt]}</span>
                          {isCorrect && <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30">Correct</Badge>}
                          {isSelected && !isCorrect && <Badge variant="outline" className="text-[9px] text-rose-600 border-rose-500/30">Your answer</Badge>}
                        </div>
                      )
                    })}
                  </div>
                  <div className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <Lightbulb className="h-3 w-3 inline mr-1 text-amber-500" />
                    {q.explanation}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => navigate('mock-tests')} variant="outline" className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Try Another Test
        </Button>
        <Button onClick={() => navigate('dashboard')} className="gap-1.5">
          View Dashboard
        </Button>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className={cn('rounded-lg p-3', bg)}>
      <Icon className={cn('h-4 w-4 mb-1', color)} />
      <div className={cn('text-xl font-bold leading-none', color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <Progress value={value} className={cn('h-1.5', color)} />
    </div>
  )
}
