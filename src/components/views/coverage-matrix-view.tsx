'use client'

import * as React from 'react'
import {
  Grid3x3,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  FileText,
  Calendar,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  verified: { label: 'Verified', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  partial: { label: 'Partial', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30' },
  missing: { label: 'Missing', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/30' },
  unverified: { label: 'Unverified', icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border' },
}

export function CoverageMatrixView() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.pyqCoverage()
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-1/2 mb-6" />
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!data) return <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">Failed to load coverage data.</div>

  const { matrix = [], summary = {}, years = [] } = data

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <Grid3x3 className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Coverage Matrix</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Historical UGC NET CS & Applications (Subject Code 087) paper coverage. Shows which exam cycles are available, imported, and verified.
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={FileText} label="Total Papers" value={summary.totalPapers ?? 0} color="text-blue-600" />
        <SummaryCard icon={CheckCircle2} label="Verified Papers" value={summary.verifiedPapers ?? 0} color="text-emerald-600" />
        <SummaryCard icon={Layers} label="Total Questions" value={summary.totalQuestions ?? 0} color="text-violet-600" />
        <SummaryCard icon={ShieldCheck} label="Verified Questions" value={summary.verifiedQuestions ?? 0} color="text-amber-600" />
      </div>

      {/* Trust note */}
      <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Dataset Transparency</p>
            <p className="text-xs text-muted-foreground mt-1">
              This matrix shows actual imported question counts vs. expected per paper. Completeness % reflects how many questions from each paper have been extracted. Gaps are shown honestly — no fabrication.
            </p>
          </div>
        </div>
      </div>

      {/* Year × Cycle matrix */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Year-wise Coverage
            <span className="ml-auto text-[10px] text-muted-foreground font-normal">{years.length} years</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {matrix.map((yearData: any) => (
              <div key={yearData.year}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{yearData.year}</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {yearData.cycles.reduce((s: number, c: any) => s + c.totalQuestions, 0)} questions
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {yearData.cycles.map((cycleData: any) => (
                    <div key={`${yearData.year}-${cycleData.cycle}`} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cycleData.cycle}</span>
                        <Badge variant="secondary" className="text-[9px]">{cycleData.totalQuestions}Q</Badge>
                      </div>
                      {cycleData.papers.map((paper: any) => {
                        const meta = STATUS_META[paper.status] ?? STATUS_META.unverified
                        const StatusIcon = meta.icon
                        return (
                          <button
                            key={paper.paperId}
                            onClick={() => navigate('pyqs', { paper: paper.paper === 'III' ? 'II' : paper.paper })}
                            className={cn(
                              'block w-full text-left rounded-md border p-2.5 transition-all hover:shadow-sm',
                              meta.bg,
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
                              <span className="text-xs font-medium">
                                Paper {paper.paper} {paper.shift && `· ${paper.shift}`}
                              </span>
                              <span className={cn('ml-auto text-[10px] font-bold', meta.color)}>
                                {paper.completeness}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{paper.importedQuestions} / {paper.expectedQuestions} Qs imported</span>
                              {paper.answerKeyAvailable && (
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1">Answer Key ✓</Badge>
                              )}
                            </div>
                            <Progress value={paper.completeness} className="h-0.5 mt-1.5" />
                            {paper.examDate && (
                              <div className="text-[9px] text-muted-foreground mt-1">Exam date: {paper.examDate}</div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <span className="font-semibold">Legend:</span>
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const Icon = meta.icon
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn('flex h-5 w-5 items-center justify-center rounded border', meta.bg)}>
                    <Icon className={cn('h-3 w-3', meta.color)} />
                  </div>
                  <span>{meta.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unregistered papers warning */}
      {data.unregisteredPapers && data.unregisteredPapers.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Unregistered Papers Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              These papers have questions imported but no ExamPaper record. Register them for complete metadata tracking.
            </p>
            <div className="space-y-1">
              {data.unregisteredPapers.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs rounded-md border border-border p-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span>{p.pyqYear} {p.pyqSession}</span>
                  <code className="font-mono text-[10px] text-muted-foreground">{p.pyqPaperId}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={() => navigate('pyq-dashboard')} className="gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back to Dashboard
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('pyqs')} className="gap-1.5">
          Browse All PYQs <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
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
