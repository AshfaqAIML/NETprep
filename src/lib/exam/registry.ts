/**
 * Versioned examination profile registry.
 *
 * Profiles are configuration, so adding next year's pattern must never require
 * an engine change. The registry stores immutable, deep-frozen versions and can
 * resolve the version that is effective on a given date.
 */

import { cloneExamProfile, compareVersions, deepFreeze } from './blueprint'
import { assertValidExamProfile, validateExamProfile } from './validate'
import type { ExamFamily, ExamProfile } from './types'

export interface RegisterExamProfileOptions {
  /**
   * Replace an existing *draft* with the same code and version. Published and
   * retired versions are immutable so historical scores remain explainable.
   */
  replace?: boolean
}

export interface ResolveExamProfileOptions {
  /** ISO date/time used for effective-date resolution. Defaults to now. */
  at?: Date | string
  includeDraft?: boolean
  includeRetired?: boolean
}

export class ExamProfileRegistrationError extends Error {
  readonly code: string
  readonly version: string

  constructor(code: string, version: string, message: string) {
    super(message)
    this.name = 'ExamProfileRegistrationError'
    this.code = code
    this.version = version
  }
}

function versionRank(profile: ExamProfile): number {
  return Date.parse(profile.publishedAt ?? profile.effectiveFrom ?? '') || 0
}

function newestFirst(a: ExamProfile, b: ExamProfile): number {
  const byVersion = compareVersions(b.version, a.version)
  if (byVersion !== 0) return byVersion
  return versionRank(b) - versionRank(a)
}

function isWithinEffectiveWindow(
  profile: ExamProfile,
  timestamp: number,
): boolean {
  if (profile.effectiveFrom) {
    const from = Date.parse(profile.effectiveFrom)
    if (!Number.isNaN(from) && timestamp < from) return false
  }
  if (profile.effectiveTo) {
    const to = Date.parse(profile.effectiveTo)
    if (!Number.isNaN(to) && timestamp >= to) return false
  }
  return true
}

export class ExamProfileRegistry {
  private readonly profiles = new Map<string, Map<string, ExamProfile>>()

  register(input: unknown, options: RegisterExamProfileOptions = {}): ExamProfile {
    // Semantic validation also runs the structural Zod schema.
    const profile = deepFreeze(cloneExamProfile(assertValidExamProfile(input)))

    const versions = this.profiles.get(profile.code)
    const existing = versions?.get(profile.version)
    if (existing) {
      if (!options.replace) {
        throw new ExamProfileRegistrationError(
          profile.code,
          profile.version,
          `Profile ${profile.code} version ${profile.version} is already registered`,
        )
      }
      if (existing.status !== 'draft') {
        throw new ExamProfileRegistrationError(
          profile.code,
          profile.version,
          `Profile ${profile.code} version ${profile.version} is ${existing.status}; only drafts may be replaced`,
        )
      }
    }

    if (!versions) {
      this.profiles.set(profile.code, new Map([[profile.version, profile]]))
    } else {
      versions.set(profile.version, profile)
    }
    return profile
  }

  registerMany(inputs: readonly unknown[]): ExamProfile[] {
    return inputs.map((input) => this.register(input))
  }

  /** Latest version by dotted numeric comparison, regardless of status. */
  get(code: string, version?: string): ExamProfile | null {
    const versions = this.profiles.get(code)
    if (!versions) return null
    if (version !== undefined) return versions.get(version) ?? null
    return Array.from(versions.values()).sort(newestFirst)[0] ?? null
  }

  /**
   * Resolve the profile that governs an exam on `at`. Only published profiles
   * are returned by default; drafts and retired versions are opt-in.
   */
  resolve(
    code: string,
    options: ResolveExamProfileOptions = {},
  ): ExamProfile | null {
    const versions = this.profiles.get(code)
    if (!versions) return null

    const at =
      options.at === undefined
        ? new Date()
        : options.at instanceof Date
          ? options.at
          : new Date(options.at)
    if (Number.isNaN(at.getTime())) {
      throw new Error(`Invalid resolution date: ${String(options.at)}`)
    }
    const timestamp = at.getTime()

    const candidates = Array.from(versions.values()).filter((profile) => {
      if (profile.status === 'draft' && !options.includeDraft) return false
      if (profile.status === 'retired' && !options.includeRetired) return false
      return isWithinEffectiveWindow(profile, timestamp)
    })

    return candidates.sort(newestFirst)[0] ?? null
  }

  /** All versions of one profile code, newest first. */
  versions(code: string): ExamProfile[] {
    const versions = this.profiles.get(code)
    if (!versions) return []
    return Array.from(versions.values()).sort(newestFirst)
  }

  /** Every registered profile, grouped deterministically by code then version. */
  list(): ExamProfile[] {
    return Array.from(this.profiles.keys())
      .sort()
      .flatMap((code) => this.versions(code))
  }

  listByFamily(family: ExamFamily): ExamProfile[] {
    return this.list().filter((profile) => profile.family === family)
  }

  codes(): string[] {
    return Array.from(this.profiles.keys()).sort()
  }

  has(code: string, version?: string): boolean {
    return this.get(code, version) !== null
  }

  assertRegistered(code: string, version?: string): ExamProfile {
    const profile = this.get(code, version)
    if (!profile) {
      throw new ExamProfileRegistrationError(
        code,
        version ?? '*',
        version
          ? `Profile ${code} version ${version} is not registered`
          : `Profile ${code} is not registered`,
      )
    }
    return profile
  }

  get size(): number {
    let count = 0
    for (const versions of this.profiles.values()) count += versions.size
    return count
  }
}

export function createExamRegistry(profiles: readonly unknown[] = []): ExamProfileRegistry {
  const registry = new ExamProfileRegistry()
  for (const profile of profiles) registry.register(profile)
  return registry
}

/** Convenience for admin diagnostics: validate without registering. */
export function inspectExamProfile(input: unknown) {
  return validateExamProfile(input)
}
