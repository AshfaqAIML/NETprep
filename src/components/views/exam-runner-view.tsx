'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Grid3X3,
  Loader2,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { CbtLanguageToggle, useCbtLanguage } from '@/components/cbt/language-toggle'
import { QuestionPalette } from '@/components/cbt/palette'
import {
  CbtAnswerOptions,
  CbtQuestionBody,
  responseTypeLabel,
  type AnswerPatch,
} from '@/components/cbt/question-content'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  storeCbtRoute,
  writeExamHash,
} from '@/lib/cbt/client'
import {
  CBT_AUTOSAVE_DEBOUNCE_MS,
  CBT_CRITICAL_TIME_SEC,
  CBT_HEARTBEAT_INTERVAL_MS,
  CBT_TIME_WARNINGS_SEC,
} from '@/lib/cbt/ui-config'
import {
  computeAttemptCounts,
  formatClock,
  formatDuration,
  questionStatus,
  statusLabel,
} from '@/lib/cbt/status'
import type {
  CbtAttemptPayload,
  CbtResponse,
  CbtResponses,
  CbtSanitizedQuestion,
} from '@/lib/cbt/types'

type LocalAnswerPatch = AnswerPatch & { markedForReview?: boolean }

interface ResponsePatch {
  questionId: string
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  numericValue?: string | null
  markedForReview?: boolean
  visited?: boolean
  timeSpentSec?: number
}

interface PositionPatch {
  currentSectionId: string
  currentQuestionId: string
}

interface SaveBody {
  response?: ResponsePatch
  position?: PositionPatch
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function responsePatchFor(
  question: CbtSanitizedQuestion,
  response: CbtResponse | null,
  timeSpentSec = 0,
): ResponsePatch {
  const patch: ResponsePatch = {
    questionId: question.id,
    visited: true,
    ...(timeSpentSec > 0 ? { timeSpentSec } : {}),
  }

  if (response) {
    patch.markedForReview = response.markedForReview === true
  }

  if (question.responseType === 'single') {
    patch.selectedOptionId = response?.selectedOptionId ?? null
    return patch
  }
  if (question.responseType === 'multiple') {
    patch.selectedOptionIds = response?.selectedOptionIds ?? []
    return patch
  }

  const raw = response?.numericValue
  if (raw === null || raw === undefined) {
    patch.numericValue = null
    return patch
  }
  const text = typeof raw === 'number' ? String(raw) : raw.trim()
  if (text === '') {
    patch.numericValue = null
    return patch
  }
  if (!Number.isFinite(Number(text))) {
    // Keep the previous persisted answer while the candidate is mid-entry.
    return patch
  }
  patch.numericValue = text
  return patch
}

function responsesForSubmit(
  questions: CbtSanitizedQuestion[],
  responses: CbtResponses,
): CbtResponses {
  const byId = new Map(questions.map((question) => [question.id, question]))
  const output: CbtResponses = {}
  for (const [questionId, response] of Object.entries(responses)) {
    const question = byId.get(questionId)
    if (!question) continue
    if (question.responseType !== 'numeric') {
      output[questionId] = response
      continue
    }
    const raw = response.numericValue
    if (raw === null || raw === undefined) {
      output[questionId] = { ...response, numericValue: null }
      continue
    }
    const text = typeof raw === 'number' ? String(raw) : raw.trim()
    output[questionId] = {
      ...response,
      numericValue:
        text !== '' && Number.isFinite(Number(text)) ? text : null,
    }
  }
  return output
}

function savedTimeLabel(iso: string | null): string {
  if (!iso) return 'Autosave on'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Autosave on'
  return `Saved ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function ExamRunnerView() {
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)
  const attemptId =
    typeof viewParams.attemptId === 'string' ? viewParams.attemptId : ''

  const [payload, setPayload] = React.useState<CbtAttemptPayload | null>(null)
  const [language, setLanguage] = useCbtLanguage(payload?.paper.language)
  const [responses, setResponses] = React.useState<CbtResponses>({})
  const [currentQuestionId, setCurrentQuestionId] = React.useState<string | null>(
    null,
  )
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  const [deadline, setDeadline] = React.useState<number | null>(null)
  const [remaining, setRemaining] = React.useState(0)
  const [expired, setExpired] = React.useState(false)
  const [expiredOpen, setExpiredOpen] = React.useState(false)
  const [expiredError, setExpiredError] = React.useState<string | null>(null)

  const [saveState, setSaveState] = React.useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitOpen, setSubmitOpen] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  const submittedRef = React.useRef(false)
  const finalizingRef = React.useRef(false)
  const responsesRef = React.useRef<CbtResponses>({})
  const currentIdRef = React.useRef<string | null>(null)
  const dirtyResponsesRef = React.useRef<Map<string, ResponsePatch>>(new Map())
  const dirtyPositionRef = React.useRef<PositionPatch | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushPromiseRef = React.useRef<Promise<void>>(Promise.resolve())
  const heartbeatInFlightRef = React.useRef(false)
  const questionStartedAtRef = React.useRef(Date.now())
  const timeSpentRef = React.useRef<Record<string, number>>({})
  const previousRemainingRef = React.useRef<number | null>(null)
  const saveErrorToastRef = React.useRef(false)

  const openResult = React.useCallback(
    (id: string) => {
      const route = { kind: 'result' as const, id }
      writeExamHash(route)
      storeCbtRoute(route)
      navigate('exam-result', { attemptId: id })
    },
    [navigate],
  )

  const flushSave = React.useCallback((): Promise<void> => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const run = flushPromiseRef.current
      .catch(() => {})
      .then(async () => {
        if (submittedRef.current) return
        if (
          dirtyResponsesRef.current.size === 0 &&
          dirtyPositionRef.current === null
        ) {
          // Nothing is pending, so any previous "saving" state is complete.
          setSaveState('saved')
          return
        }

        setSaveState('saving')
        let currentBody: SaveBody | null = null

        try {
          let guard = 0
          while (!submittedRef.current && guard < 500) {
            guard += 1
            const nextResponse = dirtyResponsesRef.current.entries().next()
            if (!nextResponse.done) {
              const [questionId, response] = nextResponse.value
              dirtyResponsesRef.current.delete(questionId)
              currentBody = { response }
            } else if (dirtyPositionRef.current) {
              currentBody = { position: dirtyPositionRef.current }
              dirtyPositionRef.current = null
            } else {
              break
            }

            const saved = await api.saveExamResponse(attemptId, currentBody)
            currentBody = null
            if (submittedRef.current) return
            if (saved.attempt.status !== 'in_progress') {
              submittedRef.current = true
              openResult(saved.attempt.id)
              return
            }
            setLastSavedAt(saved.attempt.lastSavedAt)
          }

          saveErrorToastRef.current = false
          setSaveState('saved')
        } catch (error) {
          if (currentBody?.response) {
            const questionId = currentBody.response.questionId
            if (!dirtyResponsesRef.current.has(questionId)) {
              dirtyResponsesRef.current.set(questionId, currentBody.response)
            }
          } else if (currentBody?.position && !dirtyPositionRef.current) {
            dirtyPositionRef.current = currentBody.position
          }
          setSaveState('error')
          if (!saveErrorToastRef.current) {
            saveErrorToastRef.current = true
            toast.error(
              error instanceof Error
                ? `Autosave failed: ${error.message}`
                : 'Autosave failed. Select Retry save.',
            )
          }
        }
      })

    flushPromiseRef.current = run
    return run
  }, [attemptId, openResult])

  const scheduleFlush = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveState('saving')
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void flushSave()
    }, CBT_AUTOSAVE_DEBOUNCE_MS)
  }, [flushSave])

  const questions = payload?.paper.questions ?? []
  const sections = payload?.paper.sections ?? []
  const questionMap = React.useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  )
  const questionIndex = React.useMemo(
    () => new Map(questions.map((question, index) => [question.id, index])),
    [questions],
  )

  const captureElapsed = React.useCallback(() => {
    const id = currentIdRef.current
    if (!id) return
    const elapsed = Math.max(
      0,
      Math.round((Date.now() - questionStartedAtRef.current) / 1000),
    )
    if (elapsed > 0) {
      timeSpentRef.current[id] = (timeSpentRef.current[id] ?? 0) + elapsed
    }
    questionStartedAtRef.current = Date.now()
  }, [])

  const queueCurrentTime = React.useCallback(() => {
    const id = currentIdRef.current
    if (!id) return
    const question = questionMap.get(id)
    if (!question) return
    const live =
      (timeSpentRef.current[id] ?? 0) +
      Math.max(
        0,
        Math.round((Date.now() - questionStartedAtRef.current) / 1000),
      )
    dirtyResponsesRef.current.set(
      id,
      responsePatchFor(question, responsesRef.current[id] ?? null, live),
    )
  }, [questionMap])

  const applyPatch = React.useCallback(
    (question: CbtSanitizedQuestion, patch: LocalAnswerPatch) => {
      if (submitting || finalizingRef.current || submittedRef.current) return
      const existing = responsesRef.current[question.id] ?? {
        questionId: question.id,
      }
      const next: CbtResponse = {
        ...existing,
        ...patch,
        questionId: question.id,
        visited: true,
      }
      const nextResponses = { ...responsesRef.current, [question.id]: next }
      responsesRef.current = nextResponses
      setResponses(nextResponses)

      const live =
        (timeSpentRef.current[question.id] ?? 0) +
        Math.max(
          0,
          Math.round((Date.now() - questionStartedAtRef.current) / 1000),
        )
      dirtyResponsesRef.current.set(
        question.id,
        responsePatchFor(question, next, live),
      )
      scheduleFlush()
    },
    [scheduleFlush, submitting],
  )

  const finalize = React.useCallback(
    async (reason: 'manual' | 'timer_expired') => {
      if (!attemptId || submittedRef.current || finalizingRef.current) return
      finalizingRef.current = true
      setSubmitting(true)
      setSubmitError(null)
      setExpiredError(null)
      try {
        queueCurrentTime()
        await flushSave()
        if (submittedRef.current) return
        await api.submitExam(attemptId, {
          reason,
          responses: responsesForSubmit(questions, responsesRef.current),
        })
        submittedRef.current = true
        openResult(attemptId)
      } catch (error) {
        finalizingRef.current = false
        setSubmitting(false)
        setSaveState('error')
        const message =
          error instanceof Error
            ? error.message
            : 'The examination could not be submitted.'
        if (reason === 'timer_expired') {
          setExpiredOpen(true)
          setExpiredError(message)
        } else {
          setSubmitError(message)
          toast.error(message)
        }
      }
    },
    [attemptId, flushSave, openResult, queueCurrentTime, questions],
  )

  /**
   * The client countdown is only an anchor. Before treating local zero as
   * authoritative, flush pending work and ask the server. A heartbeat also
   * finalizes an actually expired attempt, so this covers the auto-submit path.
   */
  const confirmExpiry = React.useCallback(async () => {
    if (!attemptId || submittedRef.current || finalizingRef.current) return
    setExpiredOpen(true)
    setExpiredError(null)
    try {
      queueCurrentTime()
      await flushSave()
      if (submittedRef.current) return

      const heartbeat = await api.examHeartbeat(attemptId)
      if (heartbeat.status !== 'in_progress') {
        submittedRef.current = true
        openResult(attemptId)
        return
      }
      if (heartbeat.remainingSec > 0) {
        setExpired(false)
        setExpiredOpen(false)
        setDeadline(Date.now() + heartbeat.remainingSec * 1000)
        setRemaining(heartbeat.remainingSec)
        toast.info('The server clock was resynchronised. The examination continues.')
        return
      }
      void finalize('timer_expired')
    } catch (error) {
      setExpiredOpen(true)
      setExpiredError(
        error instanceof Error
          ? error.message
          : 'The examination could not be submitted automatically.',
      )
    }
  }, [attemptId, finalize, flushSave, openResult, queueCurrentTime])

  const goToQuestion = React.useCallback(
    (questionId: string) => {
      if (submitting || finalizingRef.current || submittedRef.current) return
      const question = questionMap.get(questionId)
      if (!question) return
      if (currentIdRef.current === questionId) {
        setPaletteOpen(false)
        return
      }

      const previousId = currentIdRef.current
      captureElapsed()
      if (previousId && previousId !== questionId) {
        const previous = questionMap.get(previousId)
        const previousTime = timeSpentRef.current[previousId] ?? 0
        if (previous && previousTime > 0) {
          // Persist time spent on the question being left. Without this, only
          // answers saved while on the question would carry a time value.
          dirtyResponsesRef.current.set(
            previousId,
            responsePatchFor(
              previous,
              responsesRef.current[previousId] ?? null,
              previousTime,
            ),
          )
        }
      }
      currentIdRef.current = questionId
      setCurrentQuestionId(questionId)
      questionStartedAtRef.current = Date.now()

      const existing = responsesRef.current[questionId]
      if (existing?.visited !== true) {
        const next: CbtResponse = {
          ...(existing ?? { questionId }),
          questionId,
          visited: true,
        }
        const nextResponses = { ...responsesRef.current, [questionId]: next }
        responsesRef.current = nextResponses
        setResponses(nextResponses)
        dirtyResponsesRef.current.set(
          questionId,
          responsePatchFor(question, next, timeSpentRef.current[questionId] ?? 0),
        )
      }

      dirtyPositionRef.current = {
        currentSectionId: question.sectionId,
        currentQuestionId: questionId,
      }
      void flushSave()
      setPaletteOpen(false)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    },
    [captureElapsed, flushSave, questionMap, submitting],
  )

  // Initial attempt load and resume.
  React.useEffect(() => {
    if (!attemptId) {
      setLoadError('No examination attempt was selected.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    api
      .examAttempt(attemptId)
      .then((loaded) => {
        if (cancelled) return
        if (loaded.attempt.status !== 'in_progress') {
          submittedRef.current = true
          openResult(loaded.attempt.id)
          return
        }

        setPayload(loaded)
        const initialResponses = loaded.attempt.responses ?? {}
        responsesRef.current = initialResponses
        setResponses(initialResponses)
        for (const [questionId, response] of Object.entries(initialResponses)) {
          if (response.timeSpentSec && response.timeSpentSec > 0) {
            timeSpentRef.current[questionId] = response.timeSpentSec
          }
        }

        const savedId = loaded.attempt.currentQuestionId
        const firstId =
          savedId && loaded.paper.questions.some((question) => question.id === savedId)
            ? savedId
            : loaded.paper.questions[0]?.id ?? null
        currentIdRef.current = firstId
        setCurrentQuestionId(firstId)
        questionStartedAtRef.current = Date.now()
        previousRemainingRef.current = null
        setDeadline(Date.now() + loaded.attempt.remainingSec * 1000)
        setRemaining(loaded.attempt.remainingSec)
        setLastSavedAt(loaded.attempt.lastSavedAt)
        setSaveState('saved')
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(
          error instanceof Error
            ? error.message
            : 'The examination session could not be loaded.',
        )
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attemptId, openResult, reloadKey])

  // Keep the route in the hash and local storage so refresh resumes this attempt.
  React.useEffect(() => {
    if (!payload) return
    const route = {
      kind: 'runner' as const,
      id: payload.attempt.id,
      profileCode: payload.attempt.profileCode,
    }
    writeExamHash(route)
    storeCbtRoute(route)
  }, [payload])

  // Local countdown display, anchored to the server-provided remaining time.
  React.useEffect(() => {
    if (deadline === null) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) setExpired(true)
    }
    tick()
    const interval = setInterval(tick, 500)
    return () => clearInterval(interval)
  }, [deadline])

  // Threshold warnings based on crossing a configured boundary.
  React.useEffect(() => {
    const previous = previousRemainingRef.current
    previousRemainingRef.current = remaining
    if (previous === null || expired) return

    const crossed = CBT_TIME_WARNINGS_SEC.filter(
      (threshold) => previous > threshold && remaining <= threshold,
    )
    if (crossed.length === 0) return
    if (remaining <= 60) toast.warning('1 minute remaining.')
    else if (remaining <= 300) toast.warning('5 minutes remaining.')
    else toast.warning('15 minutes remaining.')
  }, [remaining, expired])

  const sendHeartbeat = React.useCallback(async () => {
    if (
      !attemptId ||
      submittedRef.current ||
      finalizingRef.current ||
      heartbeatInFlightRef.current
    ) {
      return
    }
    heartbeatInFlightRef.current = true
    try {
      const heartbeat = await api.examHeartbeat(attemptId)
      if (submittedRef.current) return
      if (heartbeat.status !== 'in_progress') {
        submittedRef.current = true
        openResult(attemptId)
        return
      }
      setDeadline(Date.now() + heartbeat.remainingSec * 1000)
      setRemaining(heartbeat.remainingSec)
      if (heartbeat.remainingSec <= 0) setExpired(true)
    } catch {
      // The local countdown remains valid; the next heartbeat resynchronises it.
    } finally {
      heartbeatInFlightRef.current = false
    }
  }, [attemptId, openResult])

  React.useEffect(() => {
    if (!payload || loading) return
    const interval = setInterval(() => {
      void sendHeartbeat()
    }, CBT_HEARTBEAT_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat()
      } else {
        queueCurrentTime()
        void flushSave()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [payload, loading, sendHeartbeat, flushSave, queueCurrentTime])

  // Automatic submission at expiry, confirmed against the server clock.
  React.useEffect(() => {
    if (!expired || !payload || submittedRef.current) return
    void confirmExpiry()
  }, [expired, payload, confirmExpiry])

  // Warn before closing or refreshing during a live attempt.
  React.useEffect(() => {
    if (!payload) return
    const handler = (event: BeforeUnloadEvent) => {
      if (submittedRef.current) return
      event.preventDefault()
      event.returnValue =
        'The examination is still in progress. Are you sure you want to leave?'
      return event.returnValue
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [payload])

  const counts = React.useMemo(
    () => computeAttemptCounts(questions, responses),
    [questions, responses],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[480px] w-full" />
        </div>
      </div>
    )
  }

  if (loadError || !payload) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl border border-slate-300 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Examination session unavailable
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {loadError ?? 'The examination session could not be loaded.'}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setReloadKey((value) => value + 1)}
              className="gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('mock-tests')}
              className="gap-1.5 rounded-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Mock Tests
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = currentQuestionId
    ? questionMap.get(currentQuestionId) ?? null
    : null

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl border border-slate-300 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">
            No questions in this examination
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            The delivered paper does not contain any questions.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('mock-tests')}
            className="mt-4 rounded-none"
          >
            Back to Mock Tests
          </Button>
        </div>
      </div>
    )
  }

  const currentIndex = questionIndex.get(currentQuestion.id) ?? 0
  const sectionQuestions = questions.filter(
    (question) => question.sectionId === currentQuestion.sectionId,
  )
  const currentSectionIndex =
    sectionQuestions.findIndex((question) => question.id === currentQuestion.id) + 1
  const currentSection = sections.find(
    (section) => section.id === currentQuestion.sectionId,
  )
  const currentStatus = questionStatus(
    currentQuestion,
    responses[currentQuestion.id],
  )
  const isMarked = responses[currentQuestion.id]?.markedForReview === true
  const totalAnswered = counts.answered + counts.answeredMarked
  const unansweredTotal = counts.total - totalAnswered
  const critical = remaining > 0 && remaining <= CBT_CRITICAL_TIME_SEC

  const goPrevious = () => {
    const previous = questions[currentIndex - 1]
    if (previous) goToQuestion(previous.id)
  }
  const goNext = () => {
    const next = questions[currentIndex + 1]
    if (next) goToQuestion(next.id)
  }
  const saveAndNext = () => {
    if (submitting) return
    queueCurrentTime()
    void flushSave()
    const next = questions[currentIndex + 1]
    if (next) goToQuestion(next.id)
    else toast.info('You are on the last question.')
  }
  const markAndNext = () => {
    if (submitting) return
    applyPatch(currentQuestion, { markedForReview: true })
    void flushSave()
    const next = questions[currentIndex + 1]
    if (next) goToQuestion(next.id)
    else toast.info('Question marked for review. You are on the last question.')
  }
  const clearResponse = () => {
    if (submitting) return
    applyPatch(currentQuestion, {
      selectedOptionId: null,
      selectedOptionIds: null,
      numericValue: null,
    })
    void flushSave()
  }
  const toggleMark = () => {
    if (submitting) return
    applyPatch(currentQuestion, { markedForReview: !isMarked })
  }
  const jumpToSection = (sectionId: string) => {
    const first = questions.find((question) => question.sectionId === sectionId)
    if (first) goToQuestion(first.id)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-300 bg-white">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-900 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-tight text-slate-900">
                  {payload.paper.profileName}
                </div>
                <div className="truncate text-[11px] text-slate-600">
                  {payload.paper.subjectName ?? 'Computer-based examination'}
                </div>
              </div>
              <div className="hidden border-l border-slate-300 pl-3 md:block">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Candidate
                </div>
                <div className="text-[11px] font-medium text-slate-800">
                  {payload.attempt.candidate.name}
                  <span className="ml-2 font-mono text-slate-500">
                    {payload.attempt.candidate.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  'hidden items-center gap-1.5 text-[11px] md:flex',
                  saveState === 'error' ? 'text-red-700' : 'text-slate-600',
                )}
                aria-live="polite"
              >
                {saveState === 'saving' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saveState === 'error' ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                )}
                <span>
                  {saveState === 'saving'
                    ? 'Saving…'
                    : saveState === 'error'
                      ? 'Save failed'
                      : savedTimeLabel(lastSavedAt)}
                </span>
                {saveState === 'error' && (
                  <button
                    type="button"
                    onClick={() => void flushSave()}
                    className="font-semibold text-red-800 underline underline-offset-2"
                  >
                    Retry
                  </button>
                )}
              </div>

              <div
                className={cn(
                  'flex items-center gap-2 border px-2.5 py-1.5',
                  critical
                    ? 'border-red-300 bg-red-50 text-red-800'
                    : 'border-slate-300 bg-slate-50 text-slate-900',
                )}
                role="timer"
                aria-label={`Time remaining ${formatClock(remaining)}`}
              >
                <Clock
                  className={cn(
                    'h-4 w-4',
                    critical ? 'text-red-700' : 'text-slate-600',
                  )}
                />
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    Time left
                  </div>
                  <div className="font-mono text-base font-bold leading-none tabular-nums">
                    {formatClock(remaining)}
                  </div>
                </div>
              </div>

              <CbtLanguageToggle
                language={language}
                onChange={setLanguage}
                available={payload.paper.language?.available ?? ['en']}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaletteOpen(true)}
                className="gap-1.5 rounded-none lg:hidden"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                Palette
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setSubmitError(null)
                  setSubmitOpen(true)
                }}
                disabled={submitting}
                className="gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
              >
                <Send className="h-3.5 w-3.5" />
                Submit
              </Button>
            </div>
          </div>

          <div className="flex gap-0 overflow-x-auto border-t border-slate-200">
            {sections
              .filter((section) =>
                questions.some((question) => question.sectionId === section.id),
              )
              .map((section) => {
                const sectionCount = questions.filter(
                  (question) => question.sectionId === section.id,
                ).length
                const active = section.id === currentQuestion.sectionId
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => jumpToSection(section.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'shrink-0 border-b-2 px-3 py-2 text-left text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-900',
                      active
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-600 hover:border-slate-400 hover:text-slate-900',
                    )}
                  >
                    <span className="font-semibold">{section.code}</span>
                    <span className="ml-1 hidden sm:inline">{section.name}</span>
                    <span className="ml-1.5 tabular-nums text-slate-500">
                      ({sectionCount})
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </header>

      {critical && (
        <div
          className="border-b border-red-300 bg-red-50 px-4 py-1.5 text-center text-[11px] font-semibold text-red-800"
          role="status"
        >
          Less than {Math.max(1, Math.ceil(remaining / 60))} minute
          {Math.max(1, Math.ceil(remaining / 60)) === 1 ? '' : 's'} remaining. The
          examination will submit automatically at 00:00.
        </div>
      )}

      <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="border border-slate-300 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-sm font-bold text-slate-900">
                  Question {currentQuestion.number}
                </h1>
                <Badge
                  variant="outline"
                  className="rounded-none border-slate-400 text-[10px] text-slate-700"
                >
                  +{currentQuestion.marks} mark
                  {currentQuestion.marks === 1 ? '' : 's'}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-none border-slate-400 text-[10px] text-slate-700"
                >
                  {responseTypeLabel(currentQuestion.responseType)}
                </Badge>
                {currentQuestion.negativeMarking.mode === 'fraction' && (
                  <span className="text-[11px] font-medium text-red-700">
                    Incorrect: {currentQuestion.negativeMarking.label}
                  </span>
                )}
                <span className="truncate text-[11px] text-slate-500">
                  {currentSection?.name ?? currentQuestion.sectionName} · Q
                  {currentSectionIndex} of {sectionQuestions.length}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMark}
                disabled={submitting}
                className={cn(
                  'gap-1.5 rounded-none',
                  isMarked
                    ? 'border-violet-500 bg-violet-50 text-violet-800 hover:bg-violet-100'
                    : 'border-slate-400 text-slate-700',
                )}
              >
                <Flag className="h-3.5 w-3.5" />
                {isMarked ? 'Marked for Review' : 'Mark for Review'}
              </Button>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <CbtQuestionBody question={currentQuestion} language={language} />
              <CbtAnswerOptions
                question={currentQuestion}
                value={responses[currentQuestion.id] ?? null}
                onChange={(patch) => applyPatch(currentQuestion, patch)}
                disabled={submitting}
                language={language}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-300 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResponse}
                  disabled={submitting}
                  className="rounded-none border-slate-400"
                >
                  Clear Response
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrevious}
                  disabled={submitting || currentIndex === 0}
                  className="gap-1 rounded-none border-slate-400"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={submitting || currentIndex >= questions.length - 1}
                  className="gap-1 rounded-none border-slate-400"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAndNext}
                  disabled={submitting}
                  className="gap-1.5 rounded-none border-violet-400 text-violet-800 hover:bg-violet-50"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Mark for Review &amp; Next
                </Button>
                <Button
                  size="sm"
                  onClick={saveAndNext}
                  disabled={submitting}
                  className="gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save &amp; Next
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              Question {currentIndex + 1} of {questions.length} ·{' '}
              {formatDuration(payload.attempt.durationSec)} total duration
            </span>
            <span>
              Status:{' '}
              <span className="font-medium text-slate-700">
                {statusLabel(currentStatus)}
              </span>
            </span>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[118px] max-h-[calc(100vh-130px)] overflow-y-auto border border-slate-300 bg-white p-4 scrollbar-thin">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Question Palette
              </h2>
              <span className="text-[10px] tabular-nums text-slate-500">
                {totalAnswered}/{counts.total} answered
              </span>
            </div>
            <QuestionPalette
              sections={sections}
              questions={questions}
              responses={responses}
              counts={counts}
              currentQuestionId={currentQuestion.id}
              onSelect={goToQuestion}
            />
          </div>
        </aside>
      </div>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent
          side="right"
          animated={false}
          className="w-[92vw] overflow-y-auto bg-white p-0 text-slate-900 sm:max-w-md"
        >
          <SheetHeader className="border-b border-slate-300 p-4">
            <SheetTitle className="text-sm uppercase tracking-wider text-slate-700">
              Question Palette
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <QuestionPalette
              sections={sections}
              questions={questions}
              responses={responses}
              counts={counts}
              currentQuestionId={currentQuestion.id}
              onSelect={goToQuestion}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={submitOpen}
        onOpenChange={(open) => {
          if (!submitting) setSubmitOpen(open)
        }}
      >
        <DialogContent
          animated={false}
          className="max-w-lg rounded-none border-slate-300 bg-white text-slate-900"
        >
          <DialogHeader>
            <DialogTitle>Submit examination?</DialogTitle>
            <DialogDescription className="text-slate-600">
              Review the attempt summary before final submission. Answers cannot
              be changed after submission.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <SummaryCell label="Total questions" value={counts.total} />
            <SummaryCell label="Answered" value={totalAnswered} />
            <SummaryCell label="Unanswered" value={unansweredTotal} />
            <SummaryCell label="Marked for review" value={counts.marked} />
            <SummaryCell
              label="Answered & marked"
              value={counts.answeredMarked}
            />
            <SummaryCell label="Not visited" value={counts.notVisited} />
          </div>

          <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            {unansweredTotal > 0
              ? `${unansweredTotal} question${
                  unansweredTotal === 1 ? '' : 's'
                } have no saved answer. They will be treated as unanswered.`
              : 'Every question has a saved answer.'}{' '}
            Once submitted, this attempt is final.
          </div>

          {submitError && (
            <div className="border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
              {submitError}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitOpen(false)}
              disabled={submitting}
              className="rounded-none"
            >
              Return to examination
            </Button>
            <Button
              onClick={() => void finalize('manual')}
              disabled={submitting}
              className="gap-1.5 rounded-none bg-slate-900 text-white hover:bg-slate-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Confirm submission'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expiredOpen} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          animated={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          className="max-w-md rounded-none border-slate-300 bg-white text-slate-900"
        >
          <DialogHeader>
            <DialogTitle>Time expired</DialogTitle>
            <DialogDescription className="text-slate-600">
              The examination timer has reached zero. Your saved responses are
              being submitted now.
            </DialogDescription>
          </DialogHeader>
          {expiredError ? (
            <div className="space-y-3">
              <div className="border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                {expiredError}
              </div>
              <Button
                onClick={() => void finalize('timer_expired')}
                disabled={submitting}
                className="w-full rounded-none bg-slate-900 text-white hover:bg-slate-800"
              >
                Retry submission
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting your responses…
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-300 bg-slate-50 px-2.5 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
        {value}
      </div>
    </div>
  )
}
