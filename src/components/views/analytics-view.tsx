'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Trophy,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function AnalyticsView() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.analytics()
      .then((r) => setData(r))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">Failed to load analytics.</div>

  const { accuracyOverTime = [], studyHoursOverTime = [], topicPerformance = [], difficultyBreakdown = [], mockScoreTrend = [], insights = [], summary = {} } = data

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <BarChart3 className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your preparation trends over time — accuracy, study consistency, topic performance, and mock scores.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={Target} label="Overall Accuracy" value={`${summary.overallAccuracy ?? 0}%`} sub={`${summary.totalCorrect ?? 0}/${summary.totalQuestions ?? 0} correct`} color="text-emerald-600" />
        <SummaryCard icon={Clock} label="Study Hours (30d)" value={`${summary.totalStudyHours ?? 0}h`} sub={`${summary.studyDays ?? 0} active days`} color="text-violet-600" />
        <SummaryCard icon={CheckCircle2} label="Questions Solved" value={summary.totalQuestions ?? 0} sub="last 30 days" color="text-blue-600" />
        <SummaryCard icon={Trophy} label="Mock Tests" value={summary.mockTestsTaken ?? 0} sub="completed" color="text-amber-600" />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-muted-foreground">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Accuracy over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Accuracy Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accuracyOverTime.length === 0 ? (
              <EmptyChart message="No practice data yet. Start practicing to see your accuracy trend." />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accuracyOverTime} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} fill="url(#accGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study hours over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-500" />
              Study Hours (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studyHoursOverTime.length === 0 ? (
              <EmptyChart message="No study sessions logged yet." />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyHoursOverTime} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-rose-500" />
              Topic Performance (weakest first)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topicPerformance.length === 0 ? (
              <EmptyChart message="Practice more questions to see topic-level performance." />
            ) : (
              <div className="h-56 overflow-y-auto scrollbar-thin">
                <div className="space-y-2">
                  {topicPerformance.slice(0, 10).map((t: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate flex-1">{t.topicName}</span>
                        <span className={cn(
                          'font-semibold ml-2',
                          t.accuracy >= 75 ? 'text-emerald-600' : t.accuracy >= 50 ? 'text-amber-600' : 'text-rose-600',
                        )}>
                          {t.accuracy}% ({t.correct}/{t.total})
                        </span>
                      </div>
                      <Progress value={t.accuracy} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Difficulty breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Accuracy by Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent>
            {difficultyBreakdown.every((d: any) => d.total === 0) ? (
              <EmptyChart message="No difficulty data yet." />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyBreakdown} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="level" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {difficultyBreakdown.map((d: any, i: number) => (
                        <Cell key={i} fill={d.level === 'easy' ? '#10b981' : d.level === 'medium' ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mock score trend */}
      {mockScoreTrend.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Mock Test Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockScoreTrend} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="attempt" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: any, name: string) => [name === 'accuracy' ? `${value}%` : value, name]}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <Target className="h-6 w-6" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold">Ready to improve?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Practice more questions, take mock tests, and revisit weak areas to boost your preparation.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => navigate('practice')} className="gap-1.5">
              Practice <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('revision')} className="gap-1.5">
              Revision
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className={cn('h-4 w-4 mb-1', color)} />
        <div className={cn('text-xl font-bold leading-none', color)}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
        <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-56 flex items-center justify-center text-center">
      <div>
        <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
      </div>
    </div>
  )
}
