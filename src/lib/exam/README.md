# Examination Blueprint & Configuration Engine

This module is the single source of truth for examination patterns and
server-side scoring. It is pure TypeScript: no database, React or network code.
Persistence adapters and admin UIs belong outside this folder.

## Files

| File | Responsibility |
| --- | --- |
| `types.ts` | Canonical profile, paper, response and score types. |
| `schema.ts` | Zod structural validation for profile JSON. |
| `validate.ts` | Semantic validation (totals, section trees, marks, languages, sources). |
| `blueprint.ts` | Section traversal, resolved counts, deep freeze, version comparison. |
| `fractions.ts` | Exact rational arithmetic for 1/3 and 2/3 penalties. |
| `paper.ts` | Validates a delivered paper against a profile before scoring. |
| `scoring.ts` | MCQ/MSQ/NAT evaluation, penalties, dropped questions, section breakdowns. |
| `registry.ts` | Versioned registration and effective-date resolution. |
| `profiles/` | Concrete UGC NET and GATE profiles. |

## Basic usage

```ts
import {
  getDefaultExamRegistry,
  scoreExam,
  validateExamPaper,
} from '@/lib/exam'

const registry = getDefaultExamRegistry()
const profile = registry.resolve('GATE-CS-2027', { at: new Date() })
if (!profile) throw new Error('No effective GATE CS profile')

const validation = validateExamPaper(profile, paper)
if (!validation.ok) {
  // Do not score an invalid paper.
  throw new Error(JSON.stringify(validation.errors))
}

const result = scoreExam(profile, paper, responses)
// result.totals.finalScore, result.sections, result.questions, result.exact
```

`scoreExam` validates the profile and the paper by default. It throws
`ExamScoringError` rather than silently scoring a mis-assembled paper. Exact
scores are always available as reduced fractions in `result.exact` and
`result.questions[].netMarksExact`.

## Adding or updating a pattern

1. Copy an existing profile object.
2. Change `id`, `code`, `version`, `examYear`, dates and the pattern fields.
3. Set `supersedes` to the previous profile code/version where appropriate.
4. Run `bun run exam:verify` and `bun run exam:test`.
5. Register the new version:

```ts
registry.register(nextProfile)
```

Published and retired versions are immutable. Only drafts can be replaced with
`{ replace: true }`. The engine never branches on "UGC NET vs GATE"; all
differences live in profile data.

## Marking semantics

- **Single-correct MCQ**: full marks for correct. Incorrect answers use the
  profile's `marking.incorrect.single` rule. GATE stores
  `fraction-of-question-marks: 1/3`, which yields exactly `-1/3` for a 1-mark
  question and `-2/3` for a 2-mark question.
- **Multiple-select MSQ**: full marks only for the exact correct combination.
  No partial marks and no negative marking.
- **Numeric NAT**: no negative marking. Values are rounded to the configured
  precision, then compared using the question's tolerance override or the
  profile default (`absolute`, `relative` or `none`).
- **Dropped questions**: `award-all`, `award-attempted` or `none`, configurable
  per profile.
- **Clamping**: `result.clampTotalToZero` applies to the total only. Section
  scores remain signed so the breakdown stays additive.

## Official-pattern notes

- **UGC NET December 2026**: 150 questions / 300 marks / 180 minutes, no break,
  all compulsory, +2 per correct answer, no negative marking. Paper I is
  bilingual; Paper II subject 87 is English-only.
- **UGC standalone Paper I/II**: derived practice profiles. The bulletin
  publishes one combined 180-minute session, not separate paper durations, so
  these profiles keep the official paper totals and use the full session
  duration. This is recorded in metadata.
- **GATE CS 2027**: 65 questions / 100 marks / 180 minutes. GA 10 questions /
  15 marks. Engineering Mathematics 13 marks + CS component 72 marks = 85
  subject marks. The official pattern does not publish individual EM/CS
  question counts, so those leaf sections use `questionCount: null`; the parent
  subject section enforces 55 questions / 85 marks.
- **GATE DA 2027**: 65 questions / 100 marks / 180 minutes. GA 10/15; Data
  Science & AI 55/85.

## Verification

```bash
bun run exam:test
bun run exam:verify
bun test tests/unit/
```

`exam:verify` prints the profile matrix, checks official invariants, exercises
the registry, and runs scoring smoke tests. Mock-test generation should only
proceed when it exits successfully.

## Current boundary

This phase implements configuration, validation and scoring. It intentionally
does not yet:

- persist profiles in the database,
- expose an admin profile editor,
- replace the legacy `/api/mock-tests/submit` scoring route,
- generate mock tests.

The legacy route still uses its old hardcoded `+2` logic until it is migrated to
`scoreExam` with a registered profile.
