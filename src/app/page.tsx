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
  useInitBookmarks()

  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <ViewRouter view={view} />
      </main>
      <Footer />
      <SearchModal />
    </>
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
