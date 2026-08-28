'use client'

import * as React from 'react'
import {
  Info,
  FileText,
  Award,
  Calendar,
  UserCheck,
  ClipboardList,
  BarChart3,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Markdown } from '@/components/shared/markdown'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Pattern: FileText,
  Eligibility: UserCheck,
  Dates: Calendar,
  Application: ClipboardList,
  Result: BarChart3,
  General: Award,
}

export function ExamInfoView() {
  const navigate = useAppStore((s) => s.navigate)
  const [infos, setInfos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeKey, setActiveKey] = React.useState<string>('')

  React.useEffect(() => {
    api.examInfo()
      .then((r) => {
        setInfos(r.examInfo)
        if (r.examInfo.length > 0) setActiveKey(r.examInfo[0].key)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'Exam Info' }]} />

        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (infos.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 text-center">
        <Info className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="font-medium">No exam information available yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Check back soon for updated UGC NET exam details.</p>
      </div>
    )
  }

  const active = infos.find((i) => i.key === activeKey) ?? infos[0]
  const categories = Array.from(new Set(infos.map((i) => i.category)))

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Info className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">UGC NET Exam Information</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Everything you need to know about the UGC NET examination — pattern, eligibility, dates, application, and results.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">Important:</span> NETPrep Hub is independently operated and is NOT affiliated with NTA or UGC. Exam information is provided for reference only. Always verify the latest details on the official NTA portal.
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar nav */}
        <div className="lg:sticky lg:top-20 self-start space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">Topics</div>
          {infos.map((info) => {
            const Icon = CATEGORY_ICONS[info.category] ?? FileText
            const isActive = info.key === activeKey
            return (
              <button
                key={info.key}
                onClick={() => setActiveKey(info.key)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="flex-1 truncate">{info.title}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            )
          })}

          <div className="pt-4 mt-4 border-t border-border space-y-2">
            <Button size="sm" variant="outline" onClick={() => navigate('faq')} className="w-full justify-start gap-2">
              <Info className="h-3.5 w-3.5" /> View FAQ
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('resources')} className="w-full justify-start gap-2">
              <FileText className="h-3.5 w-3.5" /> Official Resources
            </Button>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                {React.createElement(CATEGORY_ICONS[active.category] ?? FileText, { className: 'h-4 w-4' })}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{active.title}</h2>
                <Badge variant="outline" className="text-[10px] mt-0.5">{active.category}</Badge>
              </div>
            </div>
            <Markdown content={active.content} />
            <div className="mt-6 pt-4 border-t border-border text-[10px] text-muted-foreground">
              Last updated: {new Date(active.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
