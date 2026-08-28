/** Simple typed fetch helpers for the API routes */
import type { ViewKey } from '@/lib/store'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  subjects: () => fetchJson<{ subjects: any[] }>('/api/subjects'),
  subject: (slug: string) => fetchJson<{ subject: any }>(`/api/subjects/${slug}`),

  notes: (params?: { subjectId?: string; topicId?: string; featured?: boolean; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.subjectId) qs.set('subjectId', params.subjectId)
    if (params?.topicId) qs.set('topicId', params.topicId)
    if (params?.featured) qs.set('featured', 'true')
    if (params?.limit) qs.set('limit', String(params.limit))
    return fetchJson<{ notes: any[] }>(`/api/notes?${qs.toString()}`)
  },
  note: (slug: string) => fetchJson<{ note: any; related: any[] }>(`/api/notes/${slug}`),

  cheatSheets: () => fetchJson<{ cheatSheets: any[] }>('/api/cheat-sheets'),

  books: () => fetchJson<{ books: any[] }>('/api/books'),

  questions: (params?: {
    subject?: string
    unit?: string
    topicId?: string
    difficulty?: string
    pyq?: boolean
    mode?: 'practice' | 'exam' | 'revision' | 'weak'
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.subject) qs.set('subject', params.subject)
    if (params?.unit) qs.set('unit', params.unit)
    if (params?.topicId) qs.set('topicId', params.topicId)
    if (params?.difficulty) qs.set('difficulty', params.difficulty)
    if (params?.pyq) qs.set('pyq', 'true')
    if (params?.mode) qs.set('mode', params.mode)
    if (params?.limit) qs.set('limit', String(params.limit))
    return fetchJson<{ questions: any[]; count: number }>(`/api/questions?${qs.toString()}`)
  },
  attemptQuestion: (body: { questionId: string; selectedAnswer: string; timeSpentSec?: number; mode?: string }) =>
    fetchJson<{ attempt: any; correct: boolean; correctAnswer: string; explanation: string }>(`/api/questions/attempt`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  pyqs: (params?: { subject?: string; year?: string }) => {
    const qs = new URLSearchParams()
    if (params?.subject) qs.set('subject', params.subject)
    if (params?.year) qs.set('year', params.year)
    return fetchJson<{ pyqs: any[]; pyqQuestions: any[]; count: number }>(`/api/pyqs?${qs.toString()}`)
  },

  mockTests: () => fetchJson<{ mockTests: any[] }>('/api/mock-tests'),
  mockTest: (slug: string) => fetchJson<{ mockTest: any }>(`/api/mock-tests/${slug}`),
  submitMock: (body: { mockTestId: string; answers: Record<string, string>; timeSpentSec: number }) =>
    fetchJson<{ attempt: any; result: any }>(`/api/mock-tests/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  bookmarks: (folder?: string) => fetchJson<{ bookmarks: any[] }>(`/api/bookmarks${folder ? `?folder=${folder}` : ''}`),
  bookmarksStatus: () => fetchJson<{ bookmarks: string[] }>('/api/bookmarks'),
  toggleBookmark: (body: { itemType: string; itemId: string; folder?: string; note?: string }) =>
    fetchJson<{ bookmarked: boolean; bookmark?: any }>(`/api/bookmarks`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  progress: () => fetchJson<any>('/api/progress'),
  updateTopicProgress: (body: { topicId: string; status: string; confidence?: number }) =>
    fetchJson<{ progress: any }>(`/api/progress/topic`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  dashboard: () => fetchJson<any>('/api/dashboard'),

  planner: () => fetchJson<{ tasks: any[] }>('/api/planner'),
  createTask: (body: any) =>
    fetchJson<{ task: any }>(`/api/planner`, { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (body: any) =>
    fetchJson<{ task: any }>(`/api/planner`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: (id: string) =>
    fetchJson<{ deleted: boolean }>(`/api/planner/task/${id}`, { method: 'DELETE' }),

  articles: (category?: string) =>
    fetchJson<{ articles: any[] }>(`/api/articles${category ? `?category=${category}` : ''}`),
  article: (slug: string) => fetchJson<{ article: any }>(`/api/articles/${slug}`),

  faqs: () => fetchJson<{ faqs: Record<string, any[]> }>('/api/faqs'),
  resources: () => fetchJson<{ resources: any[] }>('/api/resources'),

  search: (q: string) => fetchJson<any>(`/api/search?q=${encodeURIComponent(q)}`),

  profile: () => fetchJson<{ profile: any }>('/api/profile'),
  updateProfile: (body: any) =>
    fetchJson<{ profile: any }>(`/api/profile`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Revision center
  revision: () => fetchJson<any>('/api/revision'),

  // Analytics
  analytics: () => fetchJson<any>('/api/analytics'),

  // Exam info
  examInfo: () => fetchJson<{ examInfo: any[] }>('/api/exam-info'),

  // Personal notes
  userNotes: () => fetchJson<{ notes: any[] }>('/api/user-notes'),
  createUserNote: (body: any) =>
    fetchJson<{ note: any }>(`/api/user-notes`, { method: 'POST', body: JSON.stringify(body) }),
  updateUserNote: (body: any) =>
    fetchJson<{ note: any }>(`/api/user-notes`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUserNote: (id: string) =>
    fetchJson<{ deleted: boolean }>(`/api/user-notes/${id}`, { method: 'DELETE' }),

  // Reports
  createReport: (body: any) =>
    fetchJson<{ report: any }>(`/api/reports`, { method: 'POST', body: JSON.stringify(body) }),
}

export type NavigateFn = (view: ViewKey, params?: Record<string, any>) => void
