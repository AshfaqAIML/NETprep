'use client'

import * as React from 'react'
import { Sparkles, ArrowLeft, FileQuestion } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Markdown } from '@/components/shared/markdown'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { Breadcrumbs } from '@/components/shared/states'

export function CheatSheetsView() {
  const navigate = useAppStore((s) => s.navigate)
  const [cheatSheets, setCheatSheets] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.cheatSheets()
      .then((r) => setCheatSheets(r.cheatSheets))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'Cheat Sheets' }]} />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cheat Sheets</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Concise, last-minute revision sheets — formulas, definitions, comparisons, and key facts. Perfect for exam-week revision.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cheatSheets.map((c) => (
            <Card
              key={c.id}
              onClick={() => navigate('cheat-sheet-reader', { slug: c.slug })}
              className="group cursor-pointer relative overflow-hidden transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  {c.subject && (
                    <Badge variant="secondary" className="text-[10px]">{c.subject.name}</Badge>
                  )}
                </div>
                <h3 className="font-semibold leading-tight line-clamp-2">{c.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">{c.summary}</p>
                <div className="mt-3 text-[10px] text-primary inline-flex items-center gap-0.5">
                  Open cheat sheet →
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && cheatSheets.length === 0 && (
        <div className="text-center py-16">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No cheat sheets yet</p>
          <p className="text-sm text-muted-foreground">Cheat sheets will appear here once published.</p>
        </div>
      )}
    </div>
  )
}
