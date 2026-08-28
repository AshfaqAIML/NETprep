'use client'

import * as React from 'react'
import { Sparkles, ArrowLeft, FileQuestion } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Markdown } from '@/components/shared/markdown'
import { BookmarkButton } from '@/components/shared/bookmark-button'

export function CheatSheetReaderView() {
  const { viewParams, navigate } = useAppStore()
  const slug = viewParams.slug as string
  const [cs, setCs] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.cheatSheets()
      .then((r) => {
        const found = r.cheatSheets.find((c) => c.slug === slug)
        setCs(found ?? null)
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!cs) return <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">Cheat sheet not found.</div>

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('cheat-sheets')} className="mb-4 gap-1 text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Cheat Sheets
      </Button>

      <header className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          {cs.subject && <Badge variant="secondary" className="text-[10px]">{cs.subject.name}</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{cs.title}</h1>
        <p className="mt-2 text-muted-foreground">{cs.summary}</p>

        <div className="mt-4 flex items-center gap-2">
          <BookmarkButton itemType="cheatsheet" itemId={cs.id} />
          {cs.topic && (
            <Button variant="outline" size="sm" onClick={() => navigate('practice', { topicId: cs.topic.id })} className="gap-1.5">
              <FileQuestion className="h-3.5 w-3.5" />
              Practice Questions
            </Button>
          )}
        </div>
      </header>

      <Markdown content={cs.content} />
    </article>
  )
}
