# NETPrep UGC-NET original practice bank — authoring standard

This bank is **original practice material**. It must never claim to be an
official previous-year question, a leaked paper or an actual UGC-NET question.
Every question is written for NETPrep and labelled `sourceType: 'practice'`.

## Files and exports

Create one TypeScript file per batch, for example:

```
content/ugc-net/paper-1/u01-b1.ts
content/ugc-net/paper-2/u08-b2.ts
```

Each file must export exactly one named array:

```ts
import type { UgcQuestion } from '../types'

export const questions: UgcQuestion[] = [
  // ...
]
```

Do not edit `types.ts`, `manifest.ts`, `_template.ts`, the validator or any
application file. Only create the batch files assigned to you.

## Required question fields

Every question must include all fields in `UgcQuestion`:

- `code` — stable ID in the assigned range, e.g. `UGC-P1-U01-101`.
- `examName` — always `'UGC NET'`.
- `subject` — `'General Paper I'` or `'Computer Science & Applications'`.
- `paper` — `'I'` or `'II'`.
- `unit` — official code, e.g. `P1-U01`.
- `unitName` — exact official unit name from `manifest.ts`.
- `topic` and `subtopic` — specific, not generic labels.
- `questionType` — one of `mcq`, `assertion-reason`, `match`, `sequence`,
  `case-based`.
- `responseType` — always `'single'`.
- `marks` — always `2`.
- `difficulty` — `easy`, `medium` or `hard`.
- `cognitiveSkill` — `remember`, `understand`, `apply`, `analyse`, `evaluate`
  or `create`.
- `presentationType` — `text`, `passage`, `table`, `diagram`, `code`,
  `mathematical` or `data-interpretation`.
- `passage`, `tableMarkdown`, `codeSnippet` — required when the presentation
  type needs them.
- `questionText` — the complete stem, including any data needed to answer.
- `options` — exactly A, B, C, D; all non-empty and distinct.
- `correctAnswer` — exactly one of A, B, C, D.
- `explanation` — at least 80 characters; teach the concept, explain why the
  key is right and why the main distractors are wrong.
- `source` — always `'NETPrep original practice bank'`.
- `sourceType` — always `'practice'`.
- `provenance` — a short, truthful statement of how the question and answer
  were checked. Do not invent an external citation.
- `tags` — lower-case topical tags; include the tags required for the unit.
- `learningObjective` — one sentence describing the tested skill.
- `batch` — e.g. `P1-U01-B1`.

## Answer quality

- Exactly one option must be defensible. If two options could be argued,
  rewrite the question or the options.
- Distractors must be plausible and based on common misconceptions, not random
  numbers or obviously absurd statements.
- Do not use “all of the above”, “none of the above”, “both A and B” or
  “cannot be determined” as a lazy escape.
- Avoid negative stems where possible. If you use one, emphasise the negative
  word.
- Do not repeat the same question with different numbers. Each question must
  test a distinct concept, representation or reasoning step.
- Vary the correct option across A, B, C and D. No option should dominate.
- Use clean Markdown and LaTeX (`$...$`) where it improves clarity. Preserve
  mathematical notation, code and technical terms exactly.

## Coverage and distribution

The unit prompt gives the exact count and topic coverage. In addition:

- Use at least four distinct topics and six distinct subtopics per unit.
- Use at least three question types per unit (plain MCQ plus at least two of
  assertion-reason, match, sequence, case-based).
- Use at least four cognitive skills per unit, including `apply` and `analyse`.
- Aim for roughly 25% easy, 50% medium and 25% hard. Never let one difficulty
  fall below 15% of the unit.
- Use at least two presentation types per unit. Units with passages, tables,
  code, automata or circuits must use the relevant type substantially.
- Each question must carry the tags required by the unit prompt.

## Independent verification

Questions whose answer depends on a calculation, code, SQL, automaton, graph
or Boolean circuit **must** include a `verification` object. The validator runs
the verification independently; a failed check blocks the batch.

### Mathematics

Use a separate expression that recomputes the answer. Do not simply repeat the
option text.

```ts
verification: {
  kind: 'math',
  expression: '6 * (6 + 1)',
  expected: 42,
  tolerance: 1e-9,
}
```

The correct option must contain the expected value (or supply `answerMatch`).

### Executable code

Use JavaScript or Python only. The program must be self-contained, read no
input, and print exactly one deterministic value.

```ts
verification: {
  kind: 'code',
  language: 'javascript',
  code: 'let s = 0; for (let i = 1; i <= 5; i++) s += i * i; console.log(s);',
  expectedOutput: '55',
}
```

The correct option must contain the expected output (or supply `answerMatch`).

### SQL

Use SQLite-compatible SQL. Provide the schema, the exact query and the expected
rows. The validator creates an in-memory database and compares rows
order-insensitively.

```ts
verification: {
  kind: 'sql',
  schema: "CREATE TABLE marks (student TEXT, score INTEGER); INSERT INTO marks VALUES ('Asha', 82), ('Bilal', 76), ('Chen', 91);",
  query: 'SELECT student FROM marks WHERE score >= 80 ORDER BY student;',
  expectedRows: [{ student: 'Asha' }, { student: 'Chen' }],
  answerMatch: 'Asha and Chen',
}
```

### DFA

Provide the full transition table and acceptance tests. `answerMatch` must be a
distinctive phrase from the correct option.

```ts
verification: {
  kind: 'dfa',
  states: ['q0', 'q1'],
  alphabet: ['0', '1'],
  start: 'q0',
  accept: ['q1'],
  transitions: {
    q0: { '0': 'q0', '1': 'q1' },
    q1: { '0': 'q0', '1': 'q1' },
  },
  tests: [
    { input: '1', accepted: true },
    { input: '10', accepted: false },
  ],
  answerMatch: 'ending in 1',
}
```

### Graph

Provide the full vertex and edge list and the property to recompute. Supported
checks: `mst-weight`, `shortest-path`, `connected`, `acyclic`, `bipartite`.

```ts
verification: {
  kind: 'graph',
  vertices: ['A', 'B', 'C', 'D'],
  edges: [
    { from: 'A', to: 'B', weight: 1 },
    { from: 'B', to: 'C', weight: 2 },
    { from: 'C', to: 'D', weight: 3 },
  ],
  check: { type: 'mst-weight', expected: 6 },
  answerMatch: '6',
}
```

### Boolean circuit

Use JavaScript Boolean operators (`&&`, `||`, `!`) and give the truth-table row
or rows that establish the answer.

```ts
verification: {
  kind: 'boolean',
  expression: '(A && B) || (!A && C)',
  variables: ['A', 'B', 'C'],
  expectedTruthTable: [
    { assignment: { A: true, B: false, C: true }, value: false },
  ],
  answerMatch: '0',
}
```

## Self-check before returning

Run the validator for your unit:

```bash
bun scripts/validate-ugc-bank.ts --unit P1-U05 --verbose
```

Fix every `FAIL`. Warnings about answer distribution should be addressed when
practical. Do not remove verification metadata to silence a check; correct the
question or the verification instead.

Also run:

```bash
npx tsc --noEmit
```

Ignore only the three known unrelated errors in `examples/websocket/*` and
`ugc-net-books-module/tests/books.test.ts`.

## Prohibited content

- Claims that a question is from an official UGC-NET paper.
- Copied textbook, website or coaching material.
- Ambiguous answers or two correct options.
- Placeholder questions (“What is 2 + 2?”) or superficial number swaps.
- Code that depends on a particular runtime, locale, random seed or input.
- SQL that depends on a vendor-specific extension or a pre-populated database.
- Unverifiable external statistics presented as fact.
