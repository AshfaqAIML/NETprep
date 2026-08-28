'use client'

import { GraduationCap, Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react'
import { useAppStore, type ViewKey } from '@/lib/store'

const PLATFORM_LINKS: { label: string; view: ViewKey }[] = [
  { label: 'Home', view: 'home' },
  { label: 'Subjects', view: 'subjects' },
  { label: 'Resources', view: 'resources' },
  { label: 'Articles', view: 'articles' },
  { label: 'Exam Info', view: 'exam-info' },
  { label: 'FAQ', view: 'faq' },
]

const PREP_LINKS: { label: string; view: ViewKey }[] = [
  { label: 'Paper I', view: 'subjects' },
  { label: 'Paper II', view: 'subjects' },
  { label: 'PYQs', view: 'pyqs' },
  { label: 'Mock Tests', view: 'mock-tests' },
  { label: 'Cheat Sheets', view: 'cheat-sheets' },
  { label: 'Revision', view: 'revision' },
]

export function Footer() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight">NETPrep Hub</span>
            </div>
            <p className="text-sm text-muted-foreground text-balance max-w-xs">
              A complete digital preparation ecosystem for UGC NET aspirants — notes, practice, mock tests, analytics & planner in one place.
            </p>
            <div className="flex items-center gap-1">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
              <a
                href="mailto:hello@netprephub.example"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => navigate(l.view)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Preparation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Preparation</h4>
            <ul className="space-y-2 text-sm">
              {PREP_LINKS.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => navigate(l.view)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / External */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Official</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://ugcnet.nta.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  NTA UGC NET <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.ugc.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  UGC Official <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate('faq')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Help & FAQ
                </button>
              </li>
              <li className="text-muted-foreground">Privacy Policy</li>
              <li className="text-muted-foreground">Terms of Use</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} NETPrep Hub. Independently operated — not affiliated with NTA or UGC.</p>
          <p>Built for serious UGC NET aspirants · Demo data for educational purposes</p>
        </div>
      </div>
    </footer>
  )
}
