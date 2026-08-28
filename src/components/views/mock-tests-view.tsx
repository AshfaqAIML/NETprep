'use client'

import * as React from 'react'
import { Timer, FileQuestion, Trophy, ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

export function MockTestsView() {
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)
  const [mockTests, setMockTests] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    api.mockTests()
      .then((r) => setMockTests(r.mockTests))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[
        { label: 'Home', onClick: () => navigate('home') },
        { label: 'Mock Tests' },
      ]} />
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <Timer className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Full-length and sectional mock tests simulating the real UGC NET exam pattern. Each test includes a countdown timer, question palette, and detailed analytics.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockTests.map((mt) => (
            <Card
              key={mt.id}
              className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-red-600" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[10px]">Paper {mt.paper}</Badge>
                    {mt.subject && <Badge variant="outline" className="text-[10px]">{mt.subject.name}</Badge>}
                  </div>
                </div>
                <h3 className="font-semibold leading-tight">{mt.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{mt.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-border bg-muted/30 py-2">
                    <div className="text-sm font-bold">{mt._count?.questions ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">Questions</div>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 py-2">
                    <div className="text-sm font-bold">{mt.durationMin}</div>
                    <div className="text-[10px] text-muted-foreground">Minutes</div>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 py-2">
                    <div className="text-sm font-bold">{mt.totalMarks}</div>
                    <div className="text-[10px] text-muted-foreground">Marks</div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('mock-test-runner', { slug: mt.slug })}
                  className="w-full mt-4 gap-1.5"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Start Test
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && mockTests.length === 0 && (
        <div className="text-center py-16">
          <Timer className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No mock tests yet</p>
          <p className="text-sm text-muted-foreground">Mock tests will appear here once published.</p>
        </div>
      )}
    </div>
  )
}
