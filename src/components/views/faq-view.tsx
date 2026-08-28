'use client'

import * as React from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Breadcrumbs } from '@/components/shared/states'

export function FaqView() {
  const navigate = useAppStore((s) => s.navigate)
  const [faqs, setFaqs] = React.useState<Record<string, any[]>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    api.faqs()
      .then((r) => setFaqs(r.faqs))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const totalFaqs = Object.values(faqs).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'FAQ' }]} />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <HelpCircle className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Everything you need to know about UGC NET — eligibility, exam pattern, preparation, and more.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : totalFaqs === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">No FAQs yet</p>
          <p className="text-sm text-muted-foreground">Check back soon for answers to common questions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(faqs).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold">{category}</h2>
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {items.map((f) => (
                  <AccordionItem key={f.id} value={f.id} className="border border-border rounded-lg overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 text-left">
                      <span className="text-sm font-medium pr-3">{f.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 text-sm text-muted-foreground">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}

      {/* Help CTA */}
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <HelpCircle className="h-8 w-8 mx-auto text-primary mb-2" />
          <h3 className="font-semibold">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Explore the syllabus, take a mock test, or browse our notes library.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={() => navigate('subjects')} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
              Browse Subjects
            </button>
            <button onClick={() => navigate('mock-tests')} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
              Try a Mock Test
            </button>
            <button onClick={() => navigate('notes')} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
              Read Notes
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
