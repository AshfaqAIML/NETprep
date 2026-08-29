'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  GraduationCap,
  Search,
  Menu,
  Moon,
  Sun,
  BookMarked,
  LayoutDashboard,
  Library,
  PenTool,
  FileQuestion,
  FileText,
  Timer,
  CalendarDays,
  Sparkles,
  RotateCcw,
  BarChart3,
  Info,
  StickyNote,
  X,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAppStore, type ViewKey } from '@/lib/store'
import { useSession, signOut } from 'next-auth/react'

interface NavItem {
  key: ViewKey
  label: string
  icon: React.ElementType
  group: 'study' | 'practice' | 'personal'
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: GraduationCap, group: 'study' },
  { key: 'subjects', label: 'Subjects', icon: Library, group: 'study' },
  { key: 'pyq-dashboard', label: 'PYQs', icon: FileText, group: 'study' },
  { key: 'notes', label: 'Notes', icon: PenTool, group: 'study' },
  { key: 'cheat-sheets', label: 'Cheat Sheets', icon: Sparkles, group: 'study' },
  { key: 'books', label: 'Books', icon: BookMarked, group: 'study' },
  { key: 'articles', label: 'Articles', icon: PenTool, group: 'study' },
  { key: 'exam-info', label: 'Exam Info', icon: Info, group: 'study' },
  { key: 'practice', label: 'Practice', icon: FileQuestion, group: 'practice' },
  { key: 'pyqs', label: 'PYQ Library', icon: FileText, group: 'practice' },
  { key: 'mock-tests', label: 'Mock Tests', icon: Timer, group: 'practice' },
  { key: 'revision', label: 'Revision', icon: RotateCcw, group: 'practice' },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'personal' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, group: 'personal' },
  { key: 'planner', label: 'Planner', icon: CalendarDays, group: 'personal' },
  { key: 'bookmarks', label: 'Bookmarks', icon: BookMarked, group: 'personal' },
  { key: 'user-notes', label: 'My Notes', icon: StickyNote, group: 'personal' },
]

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const { navigate, view, setSearchOpen, mobileNavOpen, setMobileNavOpen } = useAppStore()
  const { data: session, status } = useSession()

  React.useEffect(() => setMounted(true), [])

  const handleNav = (key: ViewKey) => {
    navigate(key)
    setMobileNavOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 group"
          aria-label="NETPrep Hub home"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-base font-bold tracking-tight leading-none">NETPrep Hub</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">UGC NET Preparation</div>
          </div>
        </button>

        {/* Desktop nav — primary items only, rest in mobile menu */}
        <nav className="hidden lg:flex items-center gap-0.5 ml-2">
          {NAV_ITEMS.filter((i) => ['home', 'subjects', 'pyq-dashboard', 'notes', 'practice', 'mock-tests', 'dashboard', 'revision', 'planner'].includes(i.key)).map((item) => {
            const Icon = item.icon
            const active = view === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Search button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="gap-2 text-muted-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          {/* Auth button: session-aware */}
          {status === 'authenticated' && session?.user ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleNav('dashboard')}
                className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-2 py-1 text-sm hover:bg-muted transition-colors"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt={session.user.name ?? 'User'} className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {(session.user.name ?? session.user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate text-xs font-medium">{session.user.name ?? session.user.email}</span>
              </button>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="gap-1.5">
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleNav('auth')}
              className="gap-1.5 hidden sm:flex"
            >
              <User className="h-3.5 w-3.5" />
              Sign In
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="h-9 w-9"
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  NETPrep Hub
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-1">
                <MobileNavGroup
                  title="Study"
                  items={NAV_ITEMS.filter((i) => i.group === 'study')}
                  activeView={view}
                  onNavigate={handleNav}
                />
                <MobileNavGroup
                  title="Practice"
                  items={NAV_ITEMS.filter((i) => i.group === 'practice')}
                  activeView={view}
                  onNavigate={handleNav}
                />
                <MobileNavGroup
                  title="Personal"
                  items={NAV_ITEMS.filter((i) => i.group === 'personal')}
                  activeView={view}
                  onNavigate={handleNav}
                />
              </div>
              <div className="mt-6 rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground mb-1">Demo Account</div>
                Signed in as <span className="font-mono text-foreground">Kamraan</span> · preparing for UGC NET JRF (Computer Science)
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function MobileNavGroup({
  title,
  items,
  activeView,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  activeView: ViewKey
  onNavigate: (v: ViewKey) => void
}) {
  return (
    <div className="space-y-0.5">
      <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon
        const active = activeView === item.key
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
