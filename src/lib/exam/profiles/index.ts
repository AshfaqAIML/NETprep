/**
 * Concrete examination profiles shipped with the engine.
 *
 * New patterns are added by creating another frozen profile object and
 * registering it; the scoring engine itself does not change.
 */

import { createExamRegistry, type ExamProfileRegistry } from '../registry'
import { GATE_CS_2027 } from './gate-cs-2027'
import { GATE_DA_2027 } from './gate-da-2027'
import { UGC_NET_DEC_2026 } from './ugc-net-dec-2026'
import { UGC_NET_DEC_2026_P1 } from './ugc-net-dec-2026-p1'
import { UGC_NET_DEC_2026_P2_CS } from './ugc-net-dec-2026-p2-cs'
import { UGC_UNIT_PRACTICE_PROFILES } from './ugc-unit-practice'

export {
  GATE_CS_2027,
  GATE_DA_2027,
  UGC_NET_DEC_2026,
  UGC_NET_DEC_2026_P1,
  UGC_NET_DEC_2026_P2_CS,
  UGC_UNIT_PRACTICE_PROFILES,
}

export const EXAM_PROFILES = [
  UGC_NET_DEC_2026,
  UGC_NET_DEC_2026_P1,
  UGC_NET_DEC_2026_P2_CS,
  ...UGC_UNIT_PRACTICE_PROFILES,
  GATE_CS_2027,
  GATE_DA_2027,
] as const

export function createDefaultExamRegistry(): ExamProfileRegistry {
  return createExamRegistry(EXAM_PROFILES)
}

let defaultRegistry: ExamProfileRegistry | null = null

/** Lazily created process-wide registry for request handlers. */
export function getDefaultExamRegistry(): ExamProfileRegistry {
  defaultRegistry ??= createDefaultExamRegistry()
  return defaultRegistry
}
