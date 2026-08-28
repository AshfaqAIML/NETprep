'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Flame,
  Target,
  TrendingUp,
  Clock,
  Trophy,
  FileQuestion,
  AlertCircle,
  ArrowRight,
  Calendar,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Circle,
  CircleDot,
  BookOpen,
  Timer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ProgressRing } from '@/components/shared/progress-ring'
import { cn } from '@/lib/utils'

export function DashboardView() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = React.useState<any>(null)
  const [progress, setProgress] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([api.dashboard(), api.progress()])
      .then(([d, p]) => {
        setData(d)
        setProgress(p)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-32 w-full mb-4" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!data || !progress) return <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">Failed to load dashboard.</div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = data.profile?.name?.split(' ')[0] ?? 'Student'

  const summary = progress.summary

  // study activity over last 14 days
  const activityData = (progress.studySessions ?? []).slice(-14).map((s: any) => ({
    date: new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    hours: Math.round((s.durationMin / 60) * 10) / 10,
  }))

  // subject performance
  const subjectData = progress.subjectProgress.slice(0, 6).map((sp: any) => ({
    name: sp.subjectName.length > 18 ? sp.subjectName.slice(0, 18) + '…' : sp.subjectName,
    percentage: sp.percentage,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px]">
            <Sparkles className="h-3 w-3 mr-1 text-primary" />
            {data.profile?.targetExam ?? 'UGC NET'}
          </Badge>
          {data.examCountdown != null && (
            <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Calendar className="h-3 w-3 mr-1" />
              {data.examCountdown} days to exam
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {firstName}. <span className="text-muted-foreground font-normal">Let&apos;s make progress today.</span>
        </h1>
      </motion.div>

      {/* Top row: progress rings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <RingCard value={summary.completionPct} label="Syllabus" sublabel={`${summary.completed}/${summary.totalTopics} topics`} color="var(--primary)" />
        <RingCard value={summary.accuracy} label="Accuracy" sublabel={`${summary.correctAttempts}/${summary.totalAttempts}`} color="#10b981" />
        <RingCard value={Math.min(100, summary.streak * 5)} label="Streak" sublabel={`${summary.streak} days`} color="#f59e0b" />
        <RingCard value={Math.min(100, summary.avgMockScore / 2)} label="Avg Mock" sublabel={`${summary.avgMockScore}/200`} color="#8b5cf6" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col: Continue Learning + Today's Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Continue Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.lastNote ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-1">{data.lastNote.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {data.lastNote.subject?.name} · {data.lastNote.readingTime} min read
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('note-reader', { slug: data.lastNote.slug })} className="gap-1.5">
                    Resume
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No recent activity yet.</div>
              )}

              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('practice')} className="justify-start gap-2">
                  <FileQuestion className="h-3.5 w-3.5" />
                  Practice MCQs
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('mock-tests')} className="justify-start gap-2">
                  <Timer className="h-3.5 w-3.5" />
                  Take a Mock Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Today's Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Today&apos;s Study Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.todayTasks && data.todayTasks.length > 0 ? (
                <div className="space-y-2">
                  {data.todayTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3',
                        task.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border',
                      )}
                    >
                      <div className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5',
                        task.completed ? 'bg-emerald-500 text-white' : 'border-2 border-muted-foreground/40',
                      )}>
                        {task.completed && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[10px]">
                          {task.startTime && (
                            <Badge variant="outline" className="text-[10px]">{task.startTime}</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">{task.duration} min</Badge>
                          <Badge variant="secondary" className={cn('text-[10px] capitalize', task.priority === 'high' && 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{task.category}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No tasks scheduled for today.</p>
                  <Button size="sm" variant="outline" onClick={() => navigate('planner')} className="gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Open Planner
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate('planner')} className="mt-3 gap-1.5 text-muted-foreground">
                Open full planner <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Study activity chart */}
          {activityData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Study Activity (last {activityData.length} sessions)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#studyGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right col: Weak areas + recommendations */}
        <div className="space-y-6">
          {/* Weak Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Weak Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.weakTopics && data.weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {data.weakTopics.map((wt: any) => (
                    <button
                      key={wt.id}
                      onClick={() => navigate('subject-detail', { slug: wt.topic.unit.subject.slug })}
                      className="block w-full text-left rounded-md border border-border p-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="font-medium text-sm line-clamp-1">{wt.topic.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{wt.topic.unit.name} · {wt.topic.unit.subject.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={wt.topic.unit._count ?? 0} className="h-1 flex-1" />
                        <span className="text-[10px] text-rose-600 font-semibold">{wt.confidence ?? 'Low'}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No weak areas detected yet. Start practicing to identify them.</p>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recommended for You
                <Badge variant="outline" className="ml-auto text-[10px]">{data.recommendations?.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recommendations && data.recommendations.length > 0 ? (
                data.recommendations.map((rec: any, i: number) => (
                  <RecommendationCard
                    key={i}
                    title={rec.title}
                    desc={rec.description}
                    action={rec.action}
                    priority={rec.priority}
                    onClick={() => navigate(rec.actionTarget.view, rec.actionTarget.params)}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Start practicing to get personalized recommendations.</p>
              )}
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                      {subjectData.map((_: any, idx: number) => (
                        <Cell key={idx} fill="#10b981" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function RingCard({ value, label, sublabel, color }: { value: number; label: string; sublabel: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center">
        <ProgressRing value={value} size={72} strokeWidth={7} color={color} />
        <div className="mt-2 text-sm font-semibold">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sublabel}</div>
      </CardContent>
    </Card>
  )
}

function RecommendationCard({
  title,
  desc,
  action,
  priority,
  onClick,
}: {
  title: string
  desc: string
  action: string
  priority?: 'high' | 'medium' | 'low'
  onClick: () => void
}) {
  return (
    <div className={cn(
      'rounded-lg border p-3',
      priority === 'high' ? 'border-rose-500/30 bg-rose-500/5' : priority === 'medium' ? 'border-amber-500/30 bg-amber-500/5' : 'border-border',
    )}>
      <div className="flex items-center gap-2 mb-1">
        <div className="font-medium text-sm">{title}</div>
        {priority === 'high' && <Badge variant="secondary" className="text-[9px] bg-rose-500/15 text-rose-700 dark:text-rose-300">High priority</Badge>}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{desc}</p>
      <Button size="sm" variant="outline" onClick={onClick} className="gap-1.5">
        {action}
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  )
}
