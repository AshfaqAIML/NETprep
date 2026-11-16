/**
 * Client-side route helpers for CBT views.
 *
 * The URL hash makes a refresh resume the same attempt, while localStorage
 * provides a fallback when the hash is lost. Nothing here is authoritative:
 * the server still owns timing and submission state.
 */

export type CbtExamRoute =
  | { kind: 'instructions'; id: string; profileCode: string }
  | { kind: 'runner'; id: string; profileCode?: string }
  | { kind: 'result'; id: string; profileCode?: string }

const STORAGE_KEY = 'netprep:cbt:active'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

function isRoute(
  value: unknown,
): value is CbtExamRoute & { updatedAt?: unknown } {
  if (!value || typeof value !== 'object') return false
  const route = value as Record<string, unknown>
  if (route.kind !== 'instructions' && route.kind !== 'runner' && route.kind !== 'result') {
    return false
  }
  if (typeof route.id !== 'string' || route.id.trim() === '') return false
  if (route.kind === 'instructions' && typeof route.profileCode !== 'string') return false
  return true
}

export function parseExamHash(hash: string): CbtExamRoute | null {
  const match = hash.match(/^#\/exam\/(instructions|runner|result)\/([^/?#]+)$/)
  if (!match) return null
  const kind = match[1] as CbtExamRoute['kind']
  let id: string
  try {
    id = decodeURIComponent(match[2])
  } catch {
    return null
  }
  if (!id) return null
  if (kind === 'instructions') {
    return { kind, id, profileCode: id }
  }
  return { kind, id }
}

export function examHashFor(route: CbtExamRoute): string {
  return `#/exam/${route.kind}/${encodeURIComponent(route.id)}`
}

export function writeExamHash(route: CbtExamRoute): void {
  if (typeof window === 'undefined') return
  const next = examHashFor(route)
  if (window.location.hash === next) return
  // Replace rather than push: refreshing must restore the attempt without
  // filling browser history with one entry per question or save.
  const { pathname, search } = window.location
  window.history.replaceState(null, '', `${pathname}${search}${next}`)
}

export function clearExamHash(): void {
  if (typeof window === 'undefined') return
  const { pathname, search } = window.location
  window.history.replaceState(null, '', `${pathname}${search}`)
}

export function storeCbtRoute(route: CbtExamRoute): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...route, updatedAt: Date.now() }),
    )
  } catch {
    // Storage can be unavailable in private mode; the hash still works.
  }
}

export function readCbtRoute(): CbtExamRoute | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!isRoute(parsed)) return null
    if (
      typeof parsed.updatedAt !== 'number' ||
      Date.now() - parsed.updatedAt > MAX_AGE_MS
    ) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearCbtRoute(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}
