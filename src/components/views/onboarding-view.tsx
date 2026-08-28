'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Target,
  Clock,
  Calendar,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Library,
  Briefcase,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const EXAM_TARGETS = [
  { value: 'UGC NET JRF', label: 'UGC NET JRF', desc: 'Junior Research Fellowship + Assistant Professor' },
  { value: 'UGC NET Assistant Professor', label: 'Assistant Professor', desc: 'Assistant Professor only' },
  { value: 'Both', label: 'Both JRF & AP', desc: 'Maximize qualification scope' },
]

const SUBJECTS = [
  { slug: 'computer-science', name: 'Computer Science & Applications', code: '87', icon: Cpu },
  { slug: 'commerce', name: 'Commerce', code: '17', icon: Briefcase },
  { slug: 'management', name: 'Management', code: '17B', icon: TrendingUp },
  { slug: 'english', name: 'English Literature', code: '30', icon: BookOpen },
]

const DAILY_HOURS = [
  { value: 1, label: '< 1 hour', desc: 'Light preparation' },
  { value: 2, label: '1–2 hours', desc: 'Moderate pace' },
  { value: 4, label: '2–4 hours', desc: 'Serious preparation' },
  { value: 6, label: '4+ hours', desc: 'Intensive preparation' },
]

const PREP_LEVELS = [
  { value: 'Beginner', label: 'Beginner', desc: 'Just starting UGC NET preparation' },
  { value: 'Intermediate', label: 'Intermediate', desc: 'Some preparation done, familiar with syllabus' },
  { value: 'Advanced', label: 'Advanced', desc: 'Deep into preparation, need practice & revision' },
  { value: 'Revision', label: 'Revision', desc: 'Exam soon — focused revision mode' },
]

export function OnboardingView() {
  const navigate = useAppStore((s) => s.navigate)
  const [step, setStep] = React.useState(0)
  const [target, setTarget] = React.useState('UGC NET JRF')
  const [subject, setSubject] = React.useState('computer-science')
  const [hours, setHours] = React.useState(4)
  const [examDate, setExamDate] = React.useState('')
  const [level, setLevel] = React.useState('Intermediate')
  const [saving, setSaving] = React.useState(false)

  const steps = ['Target', 'Subject', 'Study Time', 'Exam Date', 'Level']

  const handleFinish = async () => {
    setSaving(true)
    try {
      const subj = SUBJECTS.find((s) => s.slug === subject)
      await api.updateProfile({
        targetExam: target,
        paperTwoSubject: subj?.name ?? 'Computer Science',
        dailyHours: hours,
        prepLevel: level,
        examDate: examDate || undefined,
      })
      toast.success('Profile saved! Welcome to NETPrep Hub.')
      navigate('dashboard')
    } catch (e: any) {
      toast.error('Failed to save profile')
      navigate('dashboard')
    } finally {
      setSaving(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return !!target
    if (step === 1) return !!subject
    if (step === 2) return hours > 0
    if (step === 3) return true // exam date is optional
    if (step === 4) return !!level
    return false
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to NETPrep Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Let's personalize your UGC NET preparation. This takes less than a minute.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  i < step && 'bg-emerald-500 text-white',
                  i === step && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  i > step && 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 w-8', i < step ? 'bg-emerald-500' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              {/* Step 0: Target */}
              {step === 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">What are you preparing for?</h2>
                  <p className="text-sm text-muted-foreground mb-4">This helps us tailor your dashboard and recommendations.</p>
                  <div className="space-y-2">
                    {EXAM_TARGETS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTarget(t.value)}
                        className={cn(
                          'w-full text-left rounded-lg border p-4 transition-all',
                          target === t.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', target === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                            <Target className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{t.label}</div>
                            <div className="text-xs text-muted-foreground">{t.desc}</div>
                          </div>
                          {target === t.value && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Subject */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">Select your Paper II subject</h2>
                  <p className="text-sm text-muted-foreground mb-4">Choose the subject you're appearing for in Paper II.</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {SUBJECTS.map((s) => {
                      const Icon = s.icon
                      return (
                        <button
                          key={s.slug}
                          onClick={() => setSubject(s.slug)}
                          className={cn(
                            'text-left rounded-lg border p-4 transition-all',
                            subject === s.slug ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', subject === s.slug ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{s.name}</div>
                              <div className="text-xs text-muted-foreground">Code: {s.code}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Study time */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">How much time can you study daily?</h2>
                  <p className="text-sm text-muted-foreground mb-4">We'll use this to build your study plan.</p>
                  <div className="space-y-2">
                    {DAILY_HOURS.map((h) => (
                      <button
                        key={h.value}
                        onClick={() => setHours(h.value)}
                        className={cn(
                          'w-full text-left rounded-lg border p-4 transition-all',
                          hours === h.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', hours === h.value ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{h.label}</div>
                            <div className="text-xs text-muted-foreground">{h.desc}</div>
                          </div>
                          {hours === h.value && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Exam date */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">When is your target exam date?</h2>
                  <p className="text-sm text-muted-foreground mb-4">This is optional — we'll show a countdown on your dashboard.</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">Target Exam Date (optional)</Label>
                      <Input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                    {examDate && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>You have <strong className="text-primary">{Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))} days</strong> until your exam.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Level */}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-bold mb-1">What's your current preparation level?</h2>
                  <p className="text-sm text-muted-foreground mb-4">This helps us recommend the right starting point.</p>
                  <div className="space-y-2">
                    {PREP_LEVELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLevel(l.value)}
                        className={cn(
                          'w-full text-left rounded-lg border p-4 transition-all',
                          level === l.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', level === l.value ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{l.label}</div>
                            <div className="text-xs text-muted-foreground">{l.desc}</div>
                          </div>
                          {level === l.value && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(step - 1) : navigate('home')}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Skip' : 'Back'}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1.5">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving || !canProceed()} className="gap-1.5">
              {saving ? 'Saving...' : 'Start Preparing'} <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
