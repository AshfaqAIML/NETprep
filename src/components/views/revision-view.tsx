'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  RotateCcw,
  AlertCircle,
  Bookmark,
  Clock,
  Target,
  TrendingDown,
  FileQuestion,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function RevisionView() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.revision()
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
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!data) return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">Failed to load revision data.</div>

  const { incorrectQuestions = [], bookmarkedQuestions = [], weakTopics = [], dueForReview = [], stats = {} } = data

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <RotateCcw className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Revision Center</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your personalized revision queue — mistakes, bookmarks, weak topics, and overdue material all in one place.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={XCircle} label="Mistakes" value={stats.totalWrong ?? 0} color="text-rose-600" bg="bg-rose-500/10" onClick={() => navigate('practice', { mode: 'revision' })} />
        <StatCard icon={Bookmark} label="Bookmarked Qs" value={stats.totalBookmarkedQuestions ?? 0} color="text-amber-600" bg="bg-amber-500/10" />
        <StatCard icon={TrendingDown} label="Weak Topics" value={stats.totalWeakTopics ?? 0} color="text-violet-600" bg="bg-violet-500/10" />
        <StatCard icon={Clock} label="Due for Review" value={stats.totalDueForReview ?? 0} color="text-blue-600" bg="bg-blue-500/10" />
      </div>

      {/* Insight banner */}
      {stats.revisionQueueSize > 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                You have {stats.revisionQueueSize} items in your revision queue
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Spend 20 minutes today reviewing your mistakes and weak topics. Consistent revision is more effective than cramming.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('practice', { mode: 'revision' })}
              className="gap-1.5 shrink-0"
            >
              Start Revision
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="mistakes" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="mistakes" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Mistakes ({incorrectQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="bookmarked" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            Bookmarked ({bookmarkedQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="weak" className="gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Weak Topics ({weakTopics.length})
          </TabsTrigger>
          <TabsTrigger value="due" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Due for Review ({dueForReview.length})
          </TabsTrigger>
        </TabsList>

        {/* Mistakes tab */}
        <TabsContent value="mistakes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                Questions You Got Wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incorrectQuestions.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No mistakes yet!"
                  description="You haven't answered any questions incorrectly. Start practicing to build your revision queue."
                  actionLabel="Start Practice"
                  onAction={() => navigate('practice')}
                />
              ) : (
                <div className="space-y-2">
                  {incorrectQuestions.slice(0, 20).map((q: any) => (
                    <div key={q.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px] capitalize">{q.difficulty}</Badge>
                            {q.isPYQ && <Badge variant="secondary" className="text-[9px]">PYQ {q.pyqYear}</Badge>}
                            {q.topic && (
                              <button
                                onClick={() => navigate('subject-detail', { slug: q.topic.subjectSlug })}
                                className="text-[10px] text-muted-foreground hover:text-primary"
                              >
                                {q.topic.subject} › {q.topic.name}
                              </button>
                            )}
                          </div>
                          <div className="text-sm font-medium leading-relaxed">{q.questionText}</div>
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="text-rose-600 inline-flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Your answer: {q.selectedAnswer}
                            </span>
                            <span className="text-emerald-600 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Correct: {q.correctAnswer}
                            </span>
                          </div>
                          <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                            <Lightbulb className="h-3 w-3 inline mr-1 text-amber-500" />
                            {q.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {incorrectQuestions.length > 0 && (
                    <Button
                      onClick={() => navigate('practice', { mode: 'revision' })}
                      className="w-full mt-3 gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reattempt All Mistakes ({incorrectQuestions.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookmarked tab */}
        <TabsContent value="bookmarked">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-amber-500" />
                Bookmarked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookmarkedQuestions.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title="No bookmarked questions"
                  description="Bookmark important or tricky questions while practicing to revisit them here."
                  actionLabel="Browse Questions"
                  onAction={() => navigate('practice')}
                />
              ) : (
                <div className="space-y-2">
                  {bookmarkedQuestions.slice(0, 20).map((q: any) => (
                    <div key={q.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[9px] capitalize">{q.difficulty}</Badge>
                        {q.isPYQ && <Badge variant="secondary" className="text-[9px]">PYQ {q.pyqYear}</Badge>}
                        {q.topic && (
                          <span className="text-[10px] text-muted-foreground">{q.topic.subject} › {q.topic.name}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium leading-relaxed">{q.questionText}</div>
                      <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                        <Lightbulb className="h-3 w-3 inline mr-1 text-amber-500" />
                        {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weak topics tab */}
        <TabsContent value="weak">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-violet-500" />
                Weak Topics (Low Confidence)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakTopics.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No weak topics identified"
                  description="Practice more questions to identify your weak areas. We track confidence per topic based on your attempts."
                  actionLabel="Start Practice"
                  onAction={() => navigate('practice')}
                />
              ) : (
                <div className="space-y-2">
                  {weakTopics.map((wt: any) => (
                    <button
                      key={wt.topicId}
                      onClick={() => navigate('subject-detail', { slug: wt.subjectSlug })}
                      className="block w-full text-left rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-medium text-sm">{wt.topicName}</div>
                        <Badge variant="outline" className={cn('text-[10px]', wt.confidence < 40 ? 'border-rose-500/40 text-rose-600' : 'border-amber-500/40 text-amber-600')}>
                          {wt.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{wt.subjectName} › {wt.unitName}</div>
                      <Progress value={wt.confidence} className="h-1" />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground capitalize">Status: {wt.status.replace('-', ' ')}</span>
                        <span className="text-[10px] text-primary inline-flex items-center gap-0.5">
                          Study this topic <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                  <Button
                    onClick={() => navigate('practice', { mode: 'weak' })}
                    className="w-full mt-3 gap-1.5"
                  >
                    <Target className="h-4 w-4" />
                    Practice Weak Area Questions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Due for review tab */}
        <TabsContent value="due">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Due for Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dueForReview.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Nothing due for review!"
                  description="Topics you've studied recently or marked for revision will appear here when they need attention."
                  actionLabel="Browse Syllabus"
                  onAction={() => navigate('subjects')}
                />
              ) : (
                <div className="space-y-2">
                  {dueForReview.map((dr: any) => (
                    <button
                      key={dr.topicId}
                      onClick={() => navigate('subject-detail', { slug: dr.subjectSlug })}
                      className="block w-full text-left rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-medium text-sm">{dr.topicName}</div>
                        <Badge variant="outline" className={cn(
                          'text-[10px] capitalize',
                          dr.status === 'needs-revision' ? 'border-rose-500/40 text-rose-600' : 'border-amber-500/40 text-amber-600',
                        )}>
                          {dr.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{dr.subjectName} › {dr.unitName}</div>
                      <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last updated {dr.daysSinceUpdate} day{dr.daysSinceUpdate !== 1 ? 's' : ''} ago
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg, onClick }: { icon: React.ElementType; label: string; value: number; color: string; bg: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-lg border border-border p-3 text-left transition-all hover:shadow-sm hover:border-primary/30', bg)}
    >
      <Icon className={cn('h-4 w-4 mb-1', color)} />
      <div className={cn('text-xl font-bold leading-none', color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </button>
  )
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: { icon: React.ElementType; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="text-center py-10">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction} className="gap-1.5">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
