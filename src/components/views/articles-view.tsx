'use client'

import * as React from 'react'
import { Newspaper, ArrowRight, Calendar, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

const CATEGORIES = ['All', 'Strategy', 'PYQ Analysis', 'Revision', 'Productivity', 'Subject']

export function ArticlesView() {
  const navigate = useAppStore((s) => s.navigate)
  const [articles, setArticles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [category, setCategory] = React.useState('All')

  React.useEffect(() => {
    setLoading(true)
    api.articles(category === 'All' ? undefined : category)
      .then((r) => setArticles(r.articles))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [category])

  const featured = articles.find((a) => a.featured) ?? articles[0]
  const rest = articles.filter((a) => a.id !== featured?.id)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'Articles' }]} />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <Newspaper className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Articles & Strategy</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          In-depth articles on UGC NET strategy, PYQ analysis, revision techniques, and productivity for serious aspirants.
        </p>
      </div>

      <Tabs value={category} onValueChange={setCategory} className="mb-5">
        <TabsList className="flex-wrap h-auto">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No articles in this category yet</p>
          <p className="text-sm text-muted-foreground">Check back soon for fresh content.</p>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <Card
              onClick={() => navigate('article-reader', { slug: featured.slug })}
              className="group cursor-pointer mb-6 overflow-hidden transition-all hover:shadow-md hover:border-primary/40"
            >
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-amber-500/10 p-6 flex items-center justify-center min-h-[200px]">
                    <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                    <div className="relative text-center">
                      <Newspaper className="h-12 w-12 mx-auto text-rose-600 mb-2" />
                      <Badge variant="secondary" className="text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-300">Featured</Badge>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">{featured.category}</Badge>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{featured.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{featured.excerpt}</p>
                    <div className="mt-3 text-xs text-primary inline-flex items-center gap-1">
                      Read article <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((a) => (
                <Card
                  key={a.id}
                  onClick={() => navigate('article-reader', { slug: a.slug })}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-semibold leading-tight line-clamp-2">{a.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{a.excerpt}</p>
                    {a.tags && (
                      <div className="mt-3 flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {a.tags.split(',').slice(0, 3).map((t: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[9px]">{t.trim()}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
