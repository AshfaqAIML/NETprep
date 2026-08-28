/**
 * SearchService — provider-neutral search abstraction.
 *
 * Default provider is "postgres" which uses Prisma's built-in filtering
 * (works on both SQLite and PostgreSQL). This requires zero external
 * services and works out of the box.
 *
 * For production at scale, switch to:
 *   - "meilisearch": self-hosted Meilisearch instance
 *   - "typesense": self-hosted Typesense instance
 *
 * The interface stays the same — only the SEARCH_PROVIDER env var changes.
 */

export interface SearchResult {
  id: string
  type: 'note' | 'cheatsheet' | 'subject' | 'book' | 'question' | 'article' | 'topic'
  title: string
  excerpt?: string
  url?: string
  meta?: Record<string, any>
  score?: number
}

export interface SearchQuery {
  q: string
  limit?: number
  types?: string[]
  filters?: Record<string, any>
}

export interface SearchAdapter {
  readonly provider: string
  search(query: SearchQuery): Promise<SearchResult[]>
  index(documents: SearchResult[]): Promise<void>
  isConfigured(): boolean
}

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

let _instance: SearchAdapter | null = null

export function getSearchProvider(): SearchAdapter {
  if (_instance) return _instance

  const provider = (process.env.SEARCH_PROVIDER ?? 'postgres').toLowerCase()

  switch (provider) {
    case 'meilisearch':
      _instance = new MeilisearchAdapter()
      break
    case 'typesense':
      _instance = new TypesenseAdapter()
      break
    case 'postgres':
    default:
      _instance = new PostgresSearchAdapter()
      break
  }

  return _instance
}

// ---------------------------------------------------------------------------
// Postgres/Prisma search (default — works everywhere, zero config)
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'

export class PostgresSearchAdapter implements SearchAdapter {
  readonly provider = 'postgres'

  isConfigured() {
    return true
  }

  async index(): Promise<void> {
    // No-op: data lives in the database already; no separate index needed.
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const { q, limit = 20, types } = query
    if (!q || q.trim().length < 2) return []

    const term = q.trim()
    const results: SearchResult[] = []

    const allowAll = !types || types.length === 0

    // Search notes
    if (allowAll || types.includes('note')) {
      const notes = await db.note.findMany({
        where: {
          OR: [
            { title: { contains: term } },
            { excerpt: { contains: term } },
            { tags: { contains: term } },
          ],
        },
        take: limit,
        include: { subject: { select: { slug: true, name: true, color: true } } },
      })
      results.push(
        ...notes.map((n) => ({
          id: n.id,
          type: 'note' as const,
          title: n.title,
          excerpt: n.excerpt,
          url: `/notes/${n.slug}`,
          meta: { subject: n.subject?.name, readingTime: n.readingTime },
        })),
      )
    }

    // Search cheat sheets
    if (allowAll || types.includes('cheatsheet')) {
      const sheets = await db.cheatSheet.findMany({
        where: {
          OR: [{ title: { contains: term } }, { summary: { contains: term } }],
        },
        take: limit,
      })
      results.push(
        ...sheets.map((c) => ({
          id: c.id,
          type: 'cheatsheet' as const,
          title: c.title,
          excerpt: c.summary,
          url: `/cheat-sheets/${c.slug}`,
        })),
      )
    }

    // Search subjects
    if (allowAll || types.includes('subject')) {
      const subjects = await db.subject.findMany({
        where: {
          OR: [{ name: { contains: term } }, { description: { contains: term } }],
        },
        take: limit,
      })
      results.push(
        ...subjects.map((s) => ({
          id: s.id,
          type: 'subject' as const,
          title: s.name,
          excerpt: s.description,
          url: `/subjects/${s.slug}`,
          meta: { code: s.code, paper: s.paper },
        })),
      )
    }

    // Search books
    if (allowAll || types.includes('book')) {
      const books = await db.book.findMany({
        where: {
          OR: [
            { title: { contains: term } },
            { author: { contains: term } },
            { description: { contains: term } },
          ],
        },
        take: limit,
      })
      results.push(
        ...books.map((b) => ({
          id: b.id,
          type: 'book' as const,
          title: b.title,
          excerpt: b.description,
          url: `/books`,
          meta: { author: b.author, rating: b.rating },
        })),
      )
    }

    // Search questions
    if (allowAll || types.includes('question')) {
      const questions = await db.question.findMany({
        where: { questionText: { contains: term } },
        take: limit,
        include: { topic: { include: { unit: { include: { subject: true } } } } },
      })
      results.push(
        ...questions.map((qst) => ({
          id: qst.id,
          type: 'question' as const,
          title: qst.questionText,
          excerpt: qst.topic?.unit?.subject?.name,
          url: `/practice`,
          meta: { difficulty: qst.difficulty, isPYQ: qst.isPYQ },
        })),
      )
    }

    // Search articles
    if (allowAll || types.includes('article')) {
      const articles = await db.article.findMany({
        where: {
          OR: [{ title: { contains: term } }, { excerpt: { contains: term } }],
        },
        take: limit,
      })
      results.push(
        ...articles.map((a) => ({
          id: a.id,
          type: 'article' as const,
          title: a.title,
          excerpt: a.excerpt,
          url: `/articles/${a.slug}`,
          meta: { category: a.category },
        })),
      )
    }

    return results.slice(0, limit)
  }
}

// ---------------------------------------------------------------------------
// Meilisearch adapter (self-hosted, open source)
// ---------------------------------------------------------------------------

export class MeilisearchAdapter implements SearchAdapter {
  readonly provider = 'meilisearch'
  private url: string
  private key: string

  constructor() {
    this.url = process.env.MEILISEARCH_URL ?? ''
    this.key = process.env.MEILISEARCH_KEY ?? ''
    if (!this.url) {
      console.warn('[SearchService:meilisearch] MEILISEARCH_URL not set — search will fail')
    }
  }

  isConfigured() {
    return !!this.url
  }

  async index(documents: SearchResult[]): Promise<void> {
    if (!this.isConfigured()) return
    await fetch(`${this.url}/indexes/netprep/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documents),
    })
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.isConfigured()) return []
    const res = await fetch(`${this.url}/indexes/netprep/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query.q, limit: query.limit ?? 20 }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.hits ?? []
  }
}

// ---------------------------------------------------------------------------
// Typesense adapter (self-hosted, open source)
// ---------------------------------------------------------------------------

export class TypesenseAdapter implements SearchAdapter {
  readonly provider = 'typesense'
  private url: string
  private key: string

  constructor() {
    this.url = process.env.TYPESENSE_URL ?? ''
    this.key = process.env.TYPESENSE_KEY ?? ''
    if (!this.url) {
      console.warn('[SearchService:typesense] TYPESENSE_URL not set — search will fail')
    }
  }

  isConfigured() {
    return !!this.url
  }

  async index(documents: SearchResult[]): Promise<void> {
    if (!this.isConfigured()) return
    await fetch(`${this.url}/collections/netprep/documents?action=upsert`, {
      method: 'POST',
      headers: {
        'X-TYPESENSE-API-KEY': this.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documents),
    })
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.isConfigured()) return []
    const params = new URLSearchParams({
      q: query.q,
      query_by: 'title,excerpt',
      per_page: String(query.limit ?? 20),
    })
    const res = await fetch(`${this.url}/collections/netprep/documents/search?${params}`, {
      headers: { 'X-TYPESENSE-API-KEY': this.key },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits ?? []).map((h: any) => h.document)
  }
}

// ---------------------------------------------------------------------------
// Convenience singleton
// ---------------------------------------------------------------------------

export const search = getSearchProvider()
