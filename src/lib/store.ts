/**
 * Global app store — handles client-side navigation between views,
 * bookmark state, search modal visibility, and recently viewed items.
 */
import { create } from 'zustand'

export type ViewKey =
  | 'home'
  | 'subjects'
  | 'subject-detail'
  | 'notes'
  | 'note-reader'
  | 'cheat-sheets'
  | 'cheat-sheet-reader'
  | 'books'
  | 'practice'
  | 'pyqs'
  | 'mock-tests'
  | 'mock-test-runner'
  | 'mock-test-result'
  | 'dashboard'
  | 'planner'
  | 'bookmarks'
  | 'analytics'
  | 'articles'
  | 'article-reader'
  | 'resources'
  | 'faq'
  | 'search-results'
  | 'topic-detail'
  | 'revision'
  | 'exam-info'
  | 'user-notes'
  | 'onboarding'
  | 'pyq-dashboard'
  | 'coverage-matrix'
  | 'admin'
  | 'book-reader'
  | 'auth'
  | 'book-library'
  | 'book-reader-pro'
  | 'about-exam'

interface AppState {
  // Navigation
  view: ViewKey
  viewParams: Record<string, any>
  navigate: (view: ViewKey, params?: Record<string, any>) => void

  // Search modal
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  lastQuery: string
  setLastQuery: (q: string) => void

  // Bookmarks (client cache of bookmarked IDs as type:id)
  bookmarkedIds: Set<string>
  setBookmarkedIds: (ids: Set<string>) => void
  toggleBookmarkId: (key: string) => void

  // Recently viewed notes (for "Continue Learning")
  recentNotes: Array<{ slug: string; title: string; subject?: string }>
  pushRecentNote: (note: { slug: string; title: string; subject?: string }) => void

  // Theme preference
  theme: 'light' | 'dark' | 'system'
  setTheme: (t: 'light' | 'dark' | 'system') => void

  // Mobile nav
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'home',
  viewParams: {},
  navigate: (view, params = {}) => {
    set({ view, viewParams: params, mobileNavOpen: false })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  lastQuery: '',
  setLastQuery: (q) => set({ lastQuery: q }),

  bookmarkedIds: new Set<string>(),
  setBookmarkedIds: (ids) => set({ bookmarkedIds: ids }),
  toggleBookmarkId: (key) => {
    const cur = new Set(get().bookmarkedIds)
    if (cur.has(key)) cur.delete(key)
    else cur.add(key)
    set({ bookmarkedIds: cur })
  },

  recentNotes: [],
  pushRecentNote: (note) => {
    const cur = get().recentNotes.filter((n) => n.slug !== note.slug)
    set({ recentNotes: [note, ...cur].slice(0, 6) })
  },

  theme: 'system',
  setTheme: (t) => set({ theme: t }),

  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}))
