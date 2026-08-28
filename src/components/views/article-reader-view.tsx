'use client'

import * as React from 'react'
import { ArrowLeft, Calendar, Tag, Newspaper } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Markdown } from '@/components/shared/markdown'

export function ArticleReaderView() {
  const { viewParams, navigate } = useAppStore()
  const slug = viewParams.slug as string
  const [article, setArticle] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.article(slug)
      .then((r) => setArticle(r.article))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!article) return <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">Article not found.</div>

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('articles')} className="mb-4 gap-1 text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Articles
      </Button>

      <header className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <Newspaper className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{article.title}</h1>
        <p className="mt-2 text-muted-foreground text-balance">{article.excerpt}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span>NETPrep Editorial</span>
        </div>
      </header>

      <Separator className="mb-6" />

      <Markdown content={article.content} />

      {article.tags && (
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {article.tags.split(',').map((t: string, i: number) => (
              <Badge key={i} variant="outline" className="text-[10px]">{t.trim()}</Badge>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
