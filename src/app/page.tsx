'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SearchModal } from '@/components/layout/search-modal'
import { HomeView } from '@/components/views/home-view'
import { SubjectsView } from '@/components/views/subjects-view'
import { SubjectDetailView } from '@/components/views/subject-detail-view'
import { NotesView } from '@/components/views/notes-view'
import { NoteReaderView } from '@/components/views/note-reader-view'
import { CheatSheetsView } from '@/components/views/cheat-sheets-view'
import { CheatSheetReaderView } from '@/components/views/cheat-sheet-reader-view'
import { BooksView } from '@/components/views/books-view'
import { PracticeView } from '@/components/views/practice-view'
import { PyqsView } from '@/components/views/pyqs-view'
import { MockTestsView } from '@/components/views/mock-tests-view'
import { MockTestRunnerView } from '@/components/views/mock-test-runner-view'
import { MockTestResultView } from '@/components/views/mock-test-result-view'
import { ExamInstructionsView } from '@/components/views/exam-instructions-view'
import { ExamRunnerView } from '@/components/views/exam-runner-view'
import { ExamResultView } from '@/components/views/exam-result-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { PlannerView } from '@/components/views/planner-view'
import { BookmarksView } from '@/components/views/bookmarks-view'
import { ArticlesView } from '@/components/views/articles-view'
import { ArticleReaderView } from '@/components/views/article-reader-view'
import { ResourcesView } from '@/components/views/resources-view'
import { FaqView } from '@/components/views/faq-view'
import { TopicDetailView } from '@/components/views/topic-detail-view'
import { RevisionView } from '@/components/views/revision-view'
import { ExamInfoView } from '@/components/views/exam-info-view'
import { UserNotesView } from '@/components/views/user-notes-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { PyqDashboardView } from '@/components/views/pyq-dashboard-view'
import { CoverageMatrixView } from '@/components/views/coverage-matrix-view'
import { AdminView } from '@/components/views/admin-view'
import { OnboardingView } from '@/components/views/onboarding-view'
import { BookReaderView } from '@/components/views/book-reader-view'
import { BookLibraryView } from '@/components/views/book-library-view'
import { BookReaderProView } from '@/components/views/book-reader-pro-view'
import { AboutExamView } from '@/components/views/about-exam-view'
import { AuthView } from '@/components/views/auth-view'
import { cn } from '@/lib/utils'
import {
  clearCbtRoute,
  clearExamHash,
  parseExamHash,
  readCbtRoute,
  storeCbtRoute,
  type CbtExamRoute,
} from '@/lib/cbt/client'
import type { ViewKey } from '@/lib/store'

const EXAM_VIEWS = new Set<string>([
  'exam-instructions',
  'exam-runner',
  'exam-result',
])

function routeTarget(route: CbtExamRoute): {
  view: ViewKey
  params: Record<string, string>
} {
  if (route.kind === 'instructions') {
    return {
      view: 'exam-instructions',
      params: { profileCode: route.profileCode ?? route.id },
    }
  }
  if (route.kind === 'runner') {
    return { view: 'exam-runner', params: { attemptId: route.id } }
  }
  return { view: 'exam-result', params: { attemptId: route.id } }
}

// Initialise bookmark cache on mount
function useInitBookmarks() {
  const setBookmarkedIds = useAppStore((s) => s.setBookmarkedIds)
  React.useEffect(() => {
    let cancelled = false
    api
      .bookmarksStatus()
      .then((res) => {
        if (!cancelled) setBookmarkedIds(new Set(res.bookmarks))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [setBookmarkedIds])
}

export default function Home() {
  const view = useAppStore((s) => s.view)
  const navigate = useAppStore((s) => s.navigate)
  const [ready, setReady] = React.useState(false)
  useInitBookmarks()

  // Restore an in-progress or completed CBT attempt from the URL hash, with
  // localStorage as a fallback when the hash was lost.
  React.useEffect(() => {
    const hashRoute = parseExamHash(window.location.hash)
    const stored = hashRoute ? null : readCbtRoute()
    const route =
      hashRoute ?? (stored && stored.kind !== 'instructions' ? stored : null)

    if (route) {
      const target = routeTarget(route)
      navigate(target.view, target.params)
      if (route.kind !== 'instructions') storeCbtRoute(route)
    }

    setReady(true)

    const onHashChange = () => {
      const next = parseExamHash(window.location.hash)
      if (!next) return
      const current = useAppStore.getState()
      const target = routeTarget(next)
      const same =
        current.view === target.view &&
        Object.entries(target.params).every(
          ([key, value]) => current.viewParams[key] === value,
        )
      if (same) return
      navigate(target.view, target.params)
      if (next.kind !== 'instructions') storeCbtRoute(next)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [navigate])

  // Leaving the examination area clears the resume pointer and URL hash.
  React.useEffect(() => {
    if (!ready || EXAM_VIEWS.has(view)) return
    if (window.location.hash.startsWith('#/exam/')) clearExamHash()
    clearCbtRoute()
  }, [view, ready])

  const examView = EXAM_VIEWS.has(view)

  return (
    <div
      className={cn(
        'flex min-h-screen w-full flex-col',
        examView && 'bg-slate-100',
      )}
    >
      {!examView && <Header />}
      <main
        className={cn(
          'w-full flex-1',
          examView && 'bg-slate-100 text-slate-900',
        )}
      >
        <ViewRouter view={view} />
      </main>
      {!examView && <Footer />}
      {!examView && <SearchModal />}
    </div>
  )
}

function ViewRouter({ view }: { view: string }) {
  switch (view) {
    case 'home':
      return <HomeView />
    case 'subjects':
      return <SubjectsView />
    case 'subject-detail':
      return <SubjectDetailView />
    case 'topic-detail':
      return <TopicDetailView />
    case 'notes':
      return <NotesView />
    case 'note-reader':
      return <NoteReaderView />
    case 'cheat-sheets':
      return <CheatSheetsView />
    case 'cheat-sheet-reader':
      return <CheatSheetReaderView />
    case 'books':
      return <BookLibraryView />
    case 'book-library':
      return <BookLibraryView />
    case 'book-reader-pro':
      return <BookReaderProView />
    case 'practice':
      return <PracticeView />
    case 'pyqs':
      return <PyqsView />
    case 'mock-tests':
      return <MockTestsView />
    case 'mock-test-runner':
      return <MockTestRunnerView />
    case 'mock-test-result':
      return <MockTestResultView />
    case 'exam-instructions':
      return <ExamInstructionsView />
    case 'exam-runner':
      return <ExamRunnerView />
    case 'exam-result':
      return <ExamResultView />
    case 'dashboard':
      return <DashboardView />
    case 'planner':
      return <PlannerView />
    case 'bookmarks':
      return <BookmarksView />
    case 'articles':
      return <ArticlesView />
    case 'article-reader':
      return <ArticleReaderView />
    case 'resources':
      return <ResourcesView />
    case 'faq':
      return <FaqView />
    case 'revision':
      return <RevisionView />
    case 'exam-info':
      return <ExamInfoView />
    case 'user-notes':
      return <UserNotesView />
    case 'analytics':
      return <AnalyticsView />
    case 'pyq-dashboard':
      return <PyqDashboardView />
    case 'coverage-matrix':
      return <CoverageMatrixView />
    case 'admin':
      return <AdminView />
    case 'onboarding':
      return <OnboardingView />
    case 'book-reader':
      return <BookReaderView />
    case 'about-exam':
      return <AboutExamView />
    case 'auth':
      return <AuthView />
    default:
      return <HomeView />
  }
}
