'use client'

import * as React from 'react'
import { ExternalLink, Link2, FileText, ShieldCheck, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  Official: { icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-500/10', label: 'Official Source' },
  Reference: { icon: BookOpen, color: 'text-violet-600 bg-violet-500/10', label: 'Reference Material' },
  Guide: { icon: FileText, color: 'text-amber-600 bg-amber-500/10', label: 'Study Guide' },
  Tool: { icon: Link2, color: 'text-rose-600 bg-rose-500/10', label: 'Tool' },
}

export function ResourcesView() {
  const navigate = useAppStore((s) => s.navigate)
  const [resources, setResources] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.resources()
      .then((r) => setResources(r.resources))
      .finally(() => setLoading(false))
  }, [])

  // Group by category
  const grouped = resources.reduce((acc: Record<string, any[]>, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'Resources' }]} />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Link2 className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Resources</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Curated external resources — official NTA/UGC links, academic platforms, and reference materials.
        </p>
      </div>

      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">Disclaimer:</span> NETPrep Hub is independently operated. External links are provided for reference. We are not affiliated with NTA, UGC, or any third-party platform unless explicitly stated.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => {
            const meta = CATEGORY_META[cat] ?? CATEGORY_META.Reference
            const Icon = meta.icon
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md', meta.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="text-lg font-semibold">{meta.label}</h2>
                  <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {items.map((r) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md', meta.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="font-semibold text-sm line-clamp-1 flex-1">{r.title}</div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </div>
                          {r.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                          )}
                          <div className="mt-1.5 text-[10px] text-muted-foreground truncate">{r.url}</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
