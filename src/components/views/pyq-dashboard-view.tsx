'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  GraduationCap,
  Cpu,
  Calendar,
  Layers,
  TrendingUp,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
  Flame,
  ArrowRight,
  BookOpen,
  Zap,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  BarChart3,
  Repeat,
  Settings,
  Grid3x3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/shared/source-badge'

export function PyqDashboardView() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = React.useState<any>(null)
  const [analytics, setAnalytics] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      api.pyqDashboard(),
      api.pyqAnalytics().catch(() => null),
    ])
      .then(([d, a]) => {
        setData(d)
        setAnalytics(a)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-1/2 mb-6" />
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">Failed to load.</div>

  const { paper1, paper2, overall, highFrequencyTopics = [], strongAreas = [], weakAreas = [] } = data
  const examPattern = analytics?.examPattern
  const unitStats = analytics?.unitStats ?? []
  const repeatedConcepts = analytics?.repeatedConcepts ?? []
  const priorities = analytics?.priorities ?? []
  const csUnitStats = unitStats.filter((u: any) => u.paper === 'II')
  const p1UnitStats = unitStats.filter((u: any) => u.paper === 'I')

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-emerald-600 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">UGC NET PYQ Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Authentic previous-year questions from official UGC NET examinations. Paper 1 (General) + Paper 2 (Computer Science & Applications).
        </p>
      </div>

      {/* Overall stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon={FileText} label="Total PYQs" value={overall.totalPyqs} color="text-emerald-600" />
        <StatBox icon={Layers} label="Exam Papers" value={overall.totalPapers} color="text-blue-600" />
        <StatBox icon={Calendar} label="Years Covered" value={overall.totalYears} color="text-violet-600" />
        <StatBox icon={Trophy} label="Mock Tests" value={overall.mockTestsAvailable} color="text-amber-600" />
      </div>

      {/* Two-paper selector cards */}
      <div className="mb-6 grid sm:grid-cols-2 gap-4">
        <PaperSelectorCard
          title="Paper 1"
          subtitle="Teaching & Research Aptitude"
          icon={GraduationCap}
          color="from-emerald-500 to-teal-600"
          stats={paper1}
          onPractice={() => navigate('pyqs', { paper: 'I' })}
          onMock={() => navigate('mock-tests', { paper: 'I' })}
        />
        <PaperSelectorCard
          title="Paper 2"
          subtitle="Computer Science & Applications"
          icon={Cpu}
          color="from-violet-500 to-purple-600"
          stats={paper2}
          onPractice={() => navigate('pyqs', { paper: 'II' })}
          onMock={() => navigate('mock-tests', { paper: 'II' })}
        />
      </div>

      {/* Trust banner */}
      <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Source Integrity</p>
            <p className="text-xs text-muted-foreground mt-1">
              All PYQs labeled <SourceBadge sourceType="official_pyq" /> are verified against official NTA examination papers with full source attribution.
              Practice questions are clearly labeled <SourceBadge sourceType="practice" /> and are never represented as official PYQs.
            </p>
          </div>
        </div>
      </div>

      {/* Exam Pattern Configuration */}
      {examPattern && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Exam Pattern — {examPattern.name}
              <Badge variant="secondary" className="text-[9px] ml-auto">Subject Code: {examPattern.subjectCode}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-md border border-border p-3">
                <div className="text-lg font-bold text-emerald-600">{examPattern.paper1Questions}</div>
                <div className="text-[9px] text-muted-foreground">Paper 1 Questions</div>
                <div className="text-[9px] text-muted-foreground">{examPattern.paper1Marks} marks</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-lg font-bold text-violet-600">{examPattern.paper2Questions}</div>
                <div className="text-[9px] text-muted-foreground">Paper 2 Questions</div>
                <div className="text-[9px] text-muted-foreground">{examPattern.paper2Marks} marks</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-lg font-bold text-amber-600">{examPattern.totalDuration}min</div>
                <div className="text-[9px] text-muted-foreground">Total Duration</div>
                <div className="text-[9px] text-muted-foreground">({Math.floor(examPattern.totalDuration / 60)}h {examPattern.totalDuration % 60}m)</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className={cn('text-lg font-bold', examPattern.negativeMarks > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                  {examPattern.negativeMarks > 0 ? `-${examPattern.negativeMarks}` : 'None'}
                </div>
                <div className="text-[9px] text-muted-foreground">Negative Marking</div>
                <div className="text-[9px] text-muted-foreground">+{examPattern.correctMarks} per correct</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[9px]">{examPattern.language}</Badge>
              <Badge variant="outline" className="text-[9px]">Syllabus v{examPattern.syllabusVersion}</Badge>
              <span>Configurable per exam cycle — not hardcoded</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unit-wise breakdown + High frequency topics */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Paper 1 units */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-500" />
              Paper 1 — Units
              <Badge variant="outline" className="ml-auto text-[10px]">{paper1.units.length} units</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {paper1.units.map((u: any) => (
                <button
                  key={u.unitId}
                  onClick={() => navigate('pyqs', { paper: 'I', subject: 'paper-1' })}
                  className="block w-full text-left rounded-md border border-border p-2.5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{u.unitName}</span>
                    <Badge variant="secondary" className="text-[9px] shrink-0">{u.pyqCount} PYQs</Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Paper 2 CS units */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-violet-500" />
              Paper 2 — CS Units
              <Badge variant="outline" className="ml-auto text-[10px]">{paper2.units.length} units</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {paper2.units.map((u: any) => (
                <button
                  key={u.unitId}
                  onClick={() => navigate('pyqs', { paper: 'II', subject: 'computer-science' })}
                  className="block w-full text-left rounded-md border border-border p-2.5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{u.unitName}</span>
                    <Badge variant="secondary" className="text-[9px] shrink-0">{u.pyqCount} PYQs</Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High frequency topics */}
      {highFrequencyTopics.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              High-Frequency Topics
              <span className="ml-auto text-[10px] text-muted-foreground font-normal">Based on {overall.totalPyqs} verified PYQs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              {highFrequencyTopics.map((t: any, i: number) => (
                <button
                  key={t.topicId}
                  onClick={() => navigate('pyqs', { paper: t.paper, topicId: t.topicId })}
                  className="flex items-center gap-3 rounded-md border border-border p-3 text-left hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{t.topicName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {t.subjectName} › {t.unitName}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[9px] shrink-0">{t.pyqCount} PYQs</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strong & weak areas */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Strong areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Strong Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strongAreas.length > 0 ? (
              <div className="space-y-2">
                {strongAreas.map((a: any) => (
                  <div key={a.unitId} className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{a.unitName}</span>
                      <Badge className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">{a.accuracy}%</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{a.correct}/{a.total} correct · {a.subjectName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Practice more questions to identify your strong areas.</p>
            )}
          </CardContent>
        </Card>

        {/* Weak areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Weak Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakAreas.length > 0 ? (
              <div className="space-y-2">
                {weakAreas.map((a: any) => (
                  <button
                    key={a.unitId}
                    onClick={() => navigate('practice', { mode: 'weak' })}
                    className="block w-full text-left rounded-md border border-rose-500/30 bg-rose-500/5 p-2.5 hover:bg-rose-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{a.unitName}</span>
                      <Badge className="text-[9px] bg-rose-500/15 text-rose-700 dark:text-rose-300">{a.accuracy}%</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{a.correct}/{a.total} correct · {a.subjectName}</div>
                    <div className="text-[10px] text-primary mt-1 inline-flex items-center gap-0.5">
                      Practice now <ArrowRight className="h-2.5 w-2.5" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No weak areas identified yet. Keep practicing!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High-Yield Analytics Section */}
      {analytics && (
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              High-Yield Analytics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Computed from {analytics.summary?.totalPyqs || 0} verified PYQs across {analytics.summary?.totalYears || 0} years ({(analytics.summary?.years || []).join(', ')}). Not hardcoded.
            </p>
          </div>

          <Tabs defaultValue="priorities" className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="priorities" className="gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Preparation Priorities ({priorities.length})
              </TabsTrigger>
              <TabsTrigger value="repeated" className="gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Repeated Concepts ({repeatedConcepts.length})
              </TabsTrigger>
              <TabsTrigger value="units" className="gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                CS Unit Stats ({csUnitStats.length})
              </TabsTrigger>
            </TabsList>

            {/* Preparation Priorities tab */}
            <TabsContent value="priorities">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Preparation Priority Engine
                    <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                      Historical frequency × User accuracy
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {priorities.length > 0 ? (
                    <div className="space-y-2">
                      {priorities.map((p: any, i: number) => (
                        <div
                          key={p.unitId}
                          className={cn(
                            'rounded-lg border p-3',
                            i < 3 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border',
                          )}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <div className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                              i < 3 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground',
                            )}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{p.unitName}</div>
                              <div className="text-[10px] text-muted-foreground">{p.reason}</div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-center">
                                <div className="text-sm font-bold">{p.historicalQuestions}</div>
                                <div className="text-[8px] text-muted-foreground">PYQs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold">{p.yearsCovered}</div>
                                <div className="text-[8px] text-muted-foreground">Years</div>
                              </div>
                              <div className="text-center">
                                <div className={cn(
                                  'text-sm font-bold',
                                  p.userAccuracy === null ? 'text-muted-foreground'
                                    : p.userAccuracy < 60 ? 'text-rose-600'
                                    : p.userAccuracy >= 75 ? 'text-emerald-600'
                                    : 'text-amber-600',
                                )}>
                                  {p.userAccuracy === null ? '—' : `${p.userAccuracy}%`}
                                </div>
                                <div className="text-[8px] text-muted-foreground">Accuracy</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate('pyqs', { paper: 'II', subject: 'computer-science' })}
                                className="gap-1 h-7 px-2"
                              >
                                Practice
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No priority data available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Repeated Concepts tab */}
            <TabsContent value="repeated">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-violet-500" />
                    Repeated Concepts
                    <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                      Topics appearing in 2+ exam years
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {repeatedConcepts.length > 0 ? (
                    <div className="space-y-2">
                      {repeatedConcepts.map((c: any) => (
                        <button
                          key={c.topicId}
                          onClick={() => navigate('pyqs', { paper: c.paper, topicId: c.topicId })}
                          className="block w-full text-left rounded-md border border-border p-3 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{c.topicName}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {c.subjectName} › {c.unitName}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="secondary" className="text-[9px]">{c.totalCount} PYQs</Badge>
                              <Badge variant="outline" className="text-[9px]">{c.yearsCount} years</Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.years.map((y: number) => (
                              <span key={y} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {y}
                              </span>
                            ))}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                              Last seen: {c.lastSeen}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No repeated concepts identified yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CS Unit Stats tab */}
            <TabsContent value="units">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-violet-500" />
                    CS Paper II — Unit-wise Historical Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {csUnitStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                            <th className="text-left py-2 px-2">Unit</th>
                            <th className="text-center py-2 px-2">PYQs</th>
                            <th className="text-center py-2 px-2">Years</th>
                            <th className="text-center py-2 px-2">Avg/Exam</th>
                            <th className="text-left py-2 px-2">Top Topics</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csUnitStats.map((u: any) => (
                            <tr key={u.unitId} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => navigate('pyqs', { paper: 'II', subject: 'computer-science' })}
                                  className="font-medium text-sm text-left hover:text-primary"
                                >
                                  {u.unitName}
                                </button>
                              </td>
                              <td className="text-center py-2 px-2">
                                <Badge variant="secondary" className="text-[10px]">{u.totalQuestions}</Badge>
                              </td>
                              <td className="text-center py-2 px-2 text-xs">{u.yearsCount}</td>
                              <td className="text-center py-2 px-2 text-xs">{u.avgPerExam}</td>
                              <td className="py-2 px-2">
                                <div className="flex flex-wrap gap-1">
                                  {u.topTopics.slice(0, 3).map((t: any, i: number) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {t.topicName} ({t.count})
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No unit stats available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Quick actions */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('pyqs')} className="justify-start gap-2">
              <FileText className="h-3.5 w-3.5" /> All PYQs
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('coverage-matrix')} className="justify-start gap-2">
              <Grid3x3 className="h-3.5 w-3.5" /> Coverage Matrix
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('pyqs', { paper: 'I' })} className="justify-start gap-2">
              <GraduationCap className="h-3.5 w-3.5" /> Paper 1 PYQs
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('pyqs', { paper: 'II' })} className="justify-start gap-2">
              <Cpu className="h-3.5 w-3.5" /> CS Paper 2 PYQs
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('mock-tests')} className="justify-start gap-2">
              <Trophy className="h-3.5 w-3.5" /> Mock Tests
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('revision')} className="justify-start gap-2">
              <AlertCircle className="h-3.5 w-3.5" /> Mistake Book
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('bookmarks')} className="justify-start gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Saved Questions
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('analytics')} className="justify-start gap-2">
              <TrendingUp className="h-3.5 w-3.5" /> Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('practice', { mode: 'revision' })} className="justify-start gap-2">
              <RotateCcw className="h-3.5 w-3.5" /> Retry Mistakes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className={cn('h-4 w-4 mb-1', color)} />
        <div className={cn('text-xl font-bold leading-none', color)}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  )
}

function PaperSelectorCard({
  title,
  subtitle,
  icon: Icon,
  color,
  stats,
  onPractice,
  onMock,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  stats: any
  onPractice: () => void
  onMock: () => void
}) {
  const solvedPct = stats.totalPyqs > 0 ? Math.round((stats.solved / stats.totalPyqs) * 100) : 0

  return (
    <Card className="overflow-hidden">
      <div className={cn('bg-gradient-to-br p-5 text-white', color)}>
        <div className="flex items-start gap-3">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold">{title}</div>
            <div className="text-xs text-white/85">{subtitle}</div>
          </div>
          {stats.latestYear && (
            <Badge className="bg-white/20 text-white border-0">Latest: {stats.years[0]}</Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-md border border-border p-2 text-center">
            <div className="text-base font-bold">{stats.totalPyqs}</div>
            <div className="text-[9px] text-muted-foreground">Total PYQs</div>
          </div>
          <div className="rounded-md border border-border p-2 text-center">
            <div className="text-base font-bold text-emerald-600">{stats.solved}</div>
            <div className="text-[9px] text-muted-foreground">Solved</div>
          </div>
          <div className="rounded-md border border-border p-2 text-center">
            <div className="text-base font-bold text-amber-600">{stats.remaining}</div>
            <div className="text-[9px] text-muted-foreground">Remaining</div>
          </div>
        </div>
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{solvedPct}% · Accuracy: {stats.accuracy}%</span>
          </div>
          <Progress value={solvedPct} className="h-1.5" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onPractice} className="flex-1 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Practice PYQs
          </Button>
          <Button size="sm" variant="outline" onClick={onMock} className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            Mock
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
