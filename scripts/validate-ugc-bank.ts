/**
 * Independent validator for the NETPrep UGC-NET original practice bank.
 *
 * Run: bun scripts/validate-ugc-bank.ts
 *      bun scripts/validate-ugc-bank.ts --unit P1-U05
 *
 * Structural checks are always applied. Questions carrying mathematics, code,
 * SQL, automata, graphs or Boolean circuits are re-computed here; a question
 * cannot reach the administrator review queue unless its answer survives the
 * independent check.
 */

import { Database } from 'bun:sqlite'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  UGC_BANK_REQUIRED_TAGS,
  UGC_BANK_UNITS,
  ugcBankUnit,
} from '../content/ugc-net/manifest'
import type { UgcQuestion, UgcVerification } from '../content/ugc-net/types'

const contentDir = join(import.meta.dir, '..', 'content', 'ugc-net')
const unitFilter = (() => {
  const index = process.argv.indexOf('--unit')
  return index >= 0 ? process.argv[index + 1] : null
})()
const verbose = process.argv.includes('--verbose')

const failures: string[] = []
const warnings: string[] = []
const questions: Array<{ question: UgcQuestion; file: string }> = []

function fail(message: string): void {
  failures.push(message)
}

function warn(message: string): void {
  warnings.push(message)
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\u0900-\u097f ]/g, '')
    .trim()
}

function normalizedQuestion(question: UgcQuestion): string {
  return normalize(
    [question.questionText, question.passage ?? '', question.codeSnippet ?? ''].join(' '),
  )
}

function optionText(question: UgcQuestion): string {
  return question.options[question.correctAnswer]
}

function hasTag(question: UgcQuestion, tag: string): boolean {
  return question.tags.some((entry) => entry.toLowerCase() === tag.toLowerCase())
}

// ---------------------------------------------------------------------------
// Independent verification
// ---------------------------------------------------------------------------

function evaluateMath(expression: string): number {
  if (expression.length > 600) throw new Error('math expression is too long')
  const prepared = expression.replace(/\^/g, '**')
  const identifiers = prepared.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []
  const allowed = new Set([
    'Math',
    'sqrt',
    'abs',
    'pow',
    'log',
    'ln',
    'exp',
    'sin',
    'cos',
    'tan',
    'PI',
    'E',
  ])
  for (const identifier of identifiers) {
    if (!allowed.has(identifier)) {
      throw new Error(`math expression uses unsupported identifier: ${identifier}`)
    }
  }
  const fn = new Function(
    'Math',
    `"use strict";
     const { sqrt, abs, pow, log, exp, sin, cos, tan, PI, E } = Math;
     const ln = Math.log;
     return (${prepared});`,
  )
  const value = fn(Math)
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`math expression did not evaluate to a finite number: ${value}`)
  }
  return value
}

function runProcess(command: string, args: string[], timeout = 8000): {
  stdout: string
  stderr: string
  exitCode: number
} {
  const result = Bun.spawnSync({
    cmd: [command, ...args],
    stdout: 'pipe',
    stderr: 'pipe',
    timeout,
  })
  return {
    stdout: new TextDecoder().decode(result.stdout).trim(),
    stderr: new TextDecoder().decode(result.stderr).trim(),
    exitCode: result.exitCode ?? -1,
  }
}

function verifyCode(verification: Extract<UgcVerification, { kind: 'code' }>): void {
  let result = { stdout: '', stderr: '', exitCode: -1 }
  if (verification.language === 'javascript') {
    result = runProcess('bun', ['-e', verification.code])
  } else {
    result = runProcess('python', ['-c', verification.code])
    if (result.exitCode === -1 || result.stderr.includes('not found')) {
      result = runProcess('py', ['-c', verification.code])
    }
  }
  if (result.exitCode !== 0) {
    throw new Error(
      `code exited with ${result.exitCode}: ${result.stderr || result.stdout || 'no output'}`,
    )
  }
  if (result.stdout !== verification.expectedOutput.trim()) {
    throw new Error(
      `code output mismatch: expected "${verification.expectedOutput.trim()}", got "${result.stdout}"`,
    )
  }
}

function normalizeRows(rows: Array<Record<string, unknown>>): string[] {
  return rows
    .map((row) =>
      JSON.stringify(
        Object.keys(row)
          .sort()
          .reduce<Record<string, unknown>>((accumulator, key) => {
            accumulator[key] = row[key]
            return accumulator
          }, {}),
      ),
    )
    .sort()
}

function verifySql(verification: Extract<UgcVerification, { kind: 'sql' }>): void {
  const database = new Database(':memory:')
  try {
    database.exec(verification.schema)
    const rows = database.query(verification.query).all() as Array<Record<string, unknown>>
    const actual = normalizeRows(JSON.parse(JSON.stringify(rows)))
    const expected = normalizeRows(verification.expectedRows)
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `SQL result mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      )
    }
  } finally {
    database.close()
  }
}

function verifyDfa(verification: Extract<UgcVerification, { kind: 'dfa' }>): void {
  const states = new Set(verification.states)
  if (states.size !== verification.states.length) {
    throw new Error('DFA contains duplicate states')
  }
  if (!states.has(verification.start)) throw new Error('DFA start state is not in states')
  for (const state of verification.accept) {
    if (!states.has(state)) throw new Error(`DFA accept state ${state} is not in states`)
  }
  for (const state of verification.states) {
    const transitions = verification.transitions[state]
    if (!transitions) throw new Error(`DFA is missing transitions for state ${state}`)
    for (const symbol of verification.alphabet) {
      const target = transitions[symbol]
      if (!target) {
        throw new Error(`DFA is missing transition ${state} --${symbol}--> ?`)
      }
      if (!states.has(target)) {
        throw new Error(`DFA transition ${state} --${symbol}--> ${target} targets an unknown state`)
      }
    }
    for (const symbol of Object.keys(transitions)) {
      if (!verification.alphabet.includes(symbol)) {
        throw new Error(`DFA transition uses symbol ${symbol} outside the alphabet`)
      }
    }
  }
  for (const test of verification.tests) {
    let state = verification.start
    for (const symbol of test.input) {
      if (!verification.alphabet.includes(symbol)) {
        throw new Error(`DFA test input contains symbol ${symbol} outside the alphabet`)
      }
      state = verification.transitions[state][symbol]
    }
    const accepted = verification.accept.includes(state)
    if (accepted !== test.accepted) {
      throw new Error(
        `DFA test "${test.input}" expected ${test.accepted ? 'accept' : 'reject'}, got ${accepted ? 'accept' : 'reject'}`,
      )
    }
  }
}

class UnionFind {
  private parent = new Map<string, string>()

  constructor(vertices: string[]) {
    for (const vertex of vertices) this.parent.set(vertex, vertex)
  }

  find(vertex: string): string {
    const parent = this.parent.get(vertex)
    if (!parent) throw new Error(`Unknown graph vertex: ${vertex}`)
    if (parent !== vertex) {
      const root = this.find(parent)
      this.parent.set(vertex, root)
      return root
    }
    return vertex
  }

  union(left: string, right: string): boolean {
    const leftRoot = this.find(left)
    const rightRoot = this.find(right)
    if (leftRoot === rightRoot) return false
    this.parent.set(rightRoot, leftRoot)
    return true
  }
}

function verifyGraph(verification: Extract<UgcVerification, { kind: 'graph' }>): void {
  const vertices = new Set(verification.vertices)
  if (vertices.size !== verification.vertices.length) {
    throw new Error('graph contains duplicate vertices')
  }
  for (const edge of verification.edges) {
    if (!vertices.has(edge.from) || !vertices.has(edge.to)) {
      throw new Error(`graph edge ${edge.from}-${edge.to} uses an unknown vertex`)
    }
    if (edge.weight !== undefined && !Number.isFinite(edge.weight)) {
      throw new Error(`graph edge ${edge.from}-${edge.to} has a non-finite weight`)
    }
  }
  const check = verification.check
  if (check.type === 'mst-weight') {
    if (verification.directed) throw new Error('MST check requires an undirected graph')
    const sorted = [...verification.edges].sort(
      (left, right) => (left.weight ?? 1) - (right.weight ?? 1),
    )
    const unionFind = new UnionFind(verification.vertices)
    let total = 0
    let selected = 0
    for (const edge of sorted) {
      if (unionFind.union(edge.from, edge.to)) {
        total += edge.weight ?? 1
        selected += 1
      }
    }
    if (selected !== verification.vertices.length - 1) {
      throw new Error('graph is disconnected; no spanning tree exists')
    }
    if (Math.abs(total - check.expected) > 1e-9) {
      throw new Error(`MST weight mismatch: expected ${check.expected}, got ${total}`)
    }
    return
  }
  if (check.type === 'shortest-path') {
    if (!vertices.has(check.from) || !vertices.has(check.to)) {
      throw new Error('shortest-path check uses an unknown vertex')
    }
    const adjacency = new Map<string, Array<{ to: string; weight: number }>>()
    for (const vertex of verification.vertices) adjacency.set(vertex, [])
    for (const edge of verification.edges) {
      const weight = edge.weight ?? 1
      if (weight < 0) throw new Error('Dijkstra check does not support negative weights')
      adjacency.get(edge.from)?.push({ to: edge.to, weight })
      if (!verification.directed) adjacency.get(edge.to)?.push({ to: edge.from, weight })
    }
    const distances = new Map<string, number>(
      verification.vertices.map((vertex) => [vertex, Infinity]),
    )
    distances.set(check.from, 0)
    const visited = new Set<string>()
    while (visited.size < verification.vertices.length) {
      let current: string | null = null
      let best = Infinity
      for (const [vertex, distance] of distances) {
        if (!visited.has(vertex) && distance < best) {
          best = distance
          current = vertex
        }
      }
      if (current === null) break
      visited.add(current)
      for (const edge of adjacency.get(current) ?? []) {
        const candidate = best + edge.weight
        if (candidate < (distances.get(edge.to) ?? Infinity)) {
          distances.set(edge.to, candidate)
        }
      }
    }
    const actual = distances.get(check.to) ?? Infinity
    if (actual !== check.expected) {
      throw new Error(`shortest path mismatch: expected ${check.expected}, got ${actual}`)
    }
    return
  }
  if (check.type === 'connected') {
    const adjacency = new Map<string, string[]>()
    for (const vertex of verification.vertices) adjacency.set(vertex, [])
    for (const edge of verification.edges) {
      adjacency.get(edge.from)?.push(edge.to)
      adjacency.get(edge.to)?.push(edge.from)
    }
    const seen = new Set<string>()
    const queue = [verification.vertices[0]]
    while (queue.length > 0) {
      const vertex = queue.shift() as string
      if (seen.has(vertex)) continue
      seen.add(vertex)
      for (const next of adjacency.get(vertex) ?? []) {
        if (!seen.has(next)) queue.push(next)
      }
    }
    const actual = seen.size === verification.vertices.length
    if (actual !== check.expected) {
      throw new Error(`connectivity mismatch: expected ${check.expected}, got ${actual}`)
    }
    return
  }
  if (check.type === 'acyclic') {
    if (verification.directed) {
      const adjacency = new Map<string, string[]>()
      for (const vertex of verification.vertices) adjacency.set(vertex, [])
      for (const edge of verification.edges) adjacency.get(edge.from)?.push(edge.to)
      const color = new Map<string, number>()
      const visit = (vertex: string): boolean => {
        color.set(vertex, 1)
        for (const next of adjacency.get(vertex) ?? []) {
          if (color.get(next) === 1) return false
          if (color.get(next) === undefined && !visit(next)) return false
        }
        color.set(vertex, 2)
        return true
      }
      for (const vertex of verification.vertices) {
        if (color.get(vertex) === undefined && !visit(vertex)) {
          const actual = false
          if (actual !== check.expected) {
            throw new Error(`acyclic mismatch: expected ${check.expected}, got ${actual}`)
          }
          return
        }
      }
      const actual = true
      if (actual !== check.expected) {
        throw new Error(`acyclic mismatch: expected ${check.expected}, got ${actual}`)
      }
      return
    }
    const unionFind = new UnionFind(verification.vertices)
    let actual = true
    for (const edge of verification.edges) {
      if (!unionFind.union(edge.from, edge.to)) {
        actual = false
        break
      }
    }
    if (actual !== check.expected) {
      throw new Error(`acyclic mismatch: expected ${check.expected}, got ${actual}`)
    }
    return
  }
  if (check.type === 'bipartite') {
    const adjacency = new Map<string, string[]>()
    for (const vertex of verification.vertices) adjacency.set(vertex, [])
    for (const edge of verification.edges) {
      adjacency.get(edge.from)?.push(edge.to)
      adjacency.get(edge.to)?.push(edge.from)
    }
    const color = new Map<string, number>()
    let actual = true
    for (const start of verification.vertices) {
      if (color.has(start)) continue
      color.set(start, 0)
      const queue = [start]
      while (queue.length > 0) {
        const vertex = queue.shift() as string
        for (const next of adjacency.get(vertex) ?? []) {
          if (!color.has(next)) {
            color.set(next, 1 - (color.get(vertex) as number))
            queue.push(next)
          } else if (color.get(next) === color.get(vertex)) {
            actual = false
          }
        }
      }
    }
    if (actual !== check.expected) {
      throw new Error(`bipartite mismatch: expected ${check.expected}, got ${actual}`)
    }
    return
  }
}

function evaluateBoolean(expression: string, assignment: Record<string, boolean>): boolean {
  const identifiers = expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []
  const allowed = new Set([...Object.keys(assignment), 'true', 'false'])
  for (const identifier of identifiers) {
    if (!allowed.has(identifier)) {
      throw new Error(`Boolean expression uses unknown identifier: ${identifier}`)
    }
  }
  if (!/^[A-Za-z0-9_!&|()\s]+$/.test(expression)) {
    throw new Error('Boolean expression contains unsupported characters')
  }
  const fn = new Function(
    ...Object.keys(assignment),
    `"use strict"; return Boolean(${expression});`,
  )
  return Boolean(fn(...Object.values(assignment)))
}

function verifyBoolean(verification: Extract<UgcVerification, { kind: 'boolean' }>): void {
  for (const row of verification.expectedTruthTable) {
    for (const variable of verification.variables) {
      if (typeof row.assignment[variable] !== 'boolean') {
        throw new Error(`truth table is missing a Boolean value for ${variable}`)
      }
    }
    const actual = evaluateBoolean(verification.expression, row.assignment)
    if (actual !== row.value) {
      throw new Error(
        `Boolean truth-table mismatch for ${JSON.stringify(row.assignment)}: expected ${row.value}, got ${actual}`,
      )
    }
  }
}

function verifyQuestion(question: UgcQuestion): void {
  const verification = question.verification
  if (!verification) return
  if (verification.kind === 'math') {
    const actual = evaluateMath(verification.expression)
    const tolerance = verification.tolerance ?? 1e-9
    if (Math.abs(actual - verification.expected) > tolerance) {
      throw new Error(
        `math mismatch: expected ${verification.expected}, got ${actual}`,
      )
    }
  } else if (verification.kind === 'code') {
    verifyCode(verification)
  } else if (verification.kind === 'sql') {
    verifySql(verification)
  } else if (verification.kind === 'dfa') {
    verifyDfa(verification)
  } else if (verification.kind === 'graph') {
    verifyGraph(verification)
  } else if (verification.kind === 'boolean') {
    verifyBoolean(verification)
  }

  const correct = optionText(question)
  if (verification.answerMatch) {
    if (!normalize(correct).includes(normalize(verification.answerMatch))) {
      throw new Error(
        `verification.answerMatch "${verification.answerMatch}" is not present in the correct option`,
      )
    }
  } else if (verification.kind === 'math') {
    const numbers = correct.match(/-?\d+(?:\.\d+)?/g) ?? []
    const expected = verification.expected
    const found = numbers.some(
      (number) => Math.abs(Number(number) - expected) <= (verification.tolerance ?? 1e-9),
    )
    if (!found) {
      throw new Error(
        `math verification expected ${expected}, but the correct option does not contain that value and no answerMatch was supplied`,
      )
    }
  } else if (verification.kind === 'code') {
    if (!normalize(correct).includes(normalize(verification.expectedOutput))) {
      throw new Error(
        `code verification expected "${verification.expectedOutput}", but the correct option does not contain it and no answerMatch was supplied`,
      )
    }
  } else if (!verification.answerMatch) {
    throw new Error(
      `${verification.kind} verification requires answerMatch so the verified result is tied to the correct option`,
    )
  }
}

// ---------------------------------------------------------------------------
// Structural checks
// ---------------------------------------------------------------------------

function validateStructure(question: UgcQuestion, file: string): void {
  const label = `${question.code || file}`
  const unit = ugcBankUnit(question.unit)
  if (!/^UGC-P[12]-U\d{2}-\d{3}$/.test(question.code)) {
    fail(`${label}: question code must match UGC-P1-U01-101`)
  }
  if (!question.code.startsWith(`UGC-${question.unit}-`)) {
    fail(`${label}: question code does not match its unit ${question.unit}`)
  }
  if (question.paper !== unit.paper) {
    fail(`${label}: paper ${question.paper} does not match ${unit.code}`)
  }
  if (question.unitName !== unit.name) {
    fail(`${label}: unitName "${question.unitName}" does not match "${unit.name}"`)
  }
  if (question.subject !== unit.subject) {
    fail(`${label}: subject "${question.subject}" does not match "${unit.subject}"`)
  }
  if (question.examName !== 'UGC NET') fail(`${label}: examName must be UGC NET`)
  if (question.responseType !== 'single') fail(`${label}: responseType must be single`)
  if (question.marks !== 2) fail(`${label}: marks must be 2`)
  if (!['easy', 'medium', 'hard'].includes(question.difficulty)) {
    fail(`${label}: invalid difficulty ${question.difficulty}`)
  }
  if (
    !['remember', 'understand', 'apply', 'analyse', 'evaluate', 'create'].includes(
      question.cognitiveSkill,
    )
  ) {
    fail(`${label}: invalid cognitiveSkill ${question.cognitiveSkill}`)
  }
  if (
    !['mcq', 'assertion-reason', 'match', 'sequence', 'case-based'].includes(
      question.questionType,
    )
  ) {
    fail(`${label}: invalid questionType ${question.questionType}`)
  }
  if (
    ![
      'text',
      'passage',
      'table',
      'diagram',
      'code',
      'mathematical',
      'data-interpretation',
    ].includes(question.presentationType)
  ) {
    fail(`${label}: invalid presentationType ${question.presentationType}`)
  }
  if (!isNonEmpty(question.topic)) fail(`${label}: topic is required`)
  if (!isNonEmpty(question.subtopic)) fail(`${label}: subtopic is required`)
  if (!isNonEmpty(question.learningObjective)) {
    fail(`${label}: learningObjective is required`)
  }
  if (!isNonEmpty(question.batch) || !question.batch.startsWith(question.unit)) {
    fail(`${label}: batch must start with ${question.unit}`)
  }
  if (question.source !== 'NETPrep original practice bank') {
    fail(`${label}: source must be NETPrep original practice bank`)
  }
  if (question.sourceType !== 'practice') fail(`${label}: sourceType must be practice`)
  if (!isNonEmpty(question.provenance)) fail(`${label}: provenance is required`)
  if (!Array.isArray(question.tags) || question.tags.length === 0) {
    fail(`${label}: at least one tag is required`)
  }
  if (!isNonEmpty(question.explanation) || question.explanation.trim().length < 80) {
    fail(`${label}: explanation must be at least 80 characters and teach the concept`)
  }
  if (!isNonEmpty(question.questionText)) fail(`${label}: questionText is required`)
  const options = question.options
  if (!options || typeof options !== 'object') {
    fail(`${label}: options object is required`)
    return
  }
  const keys = ['A', 'B', 'C', 'D'] as const
  const seen = new Set<string>()
  for (const key of keys) {
    const text = options[key]
    if (!isNonEmpty(text)) {
      fail(`${label}: option ${key} is empty`)
      continue
    }
    const normalized = normalize(text)
    if (seen.has(normalized)) fail(`${label}: options contain a duplicate`)
    seen.add(normalized)
  }
  if (!keys.includes(question.correctAnswer)) {
    fail(`${label}: correctAnswer must be A, B, C or D`)
  }
  if (question.presentationType === 'passage' && !isNonEmpty(question.passage)) {
    fail(`${label}: passage presentation requires passage text`)
  }
  if (
    (question.presentationType === 'table' ||
      question.presentationType === 'data-interpretation') &&
    !isNonEmpty(question.tableMarkdown)
  ) {
    fail(`${label}: ${question.presentationType} presentation requires tableMarkdown`)
  }
  if (question.presentationType === 'code' && !isNonEmpty(question.codeSnippet)) {
    fail(`${label}: code presentation requires codeSnippet`)
  }
  if (
    question.presentationType === 'mathematical' &&
    !question.questionText.includes('$') &&
    !question.tableMarkdown
  ) {
    fail(`${label}: mathematical presentation requires math notation`)
  }
  const text = `${question.questionText}\n${question.explanation}`.toLowerCase()
  for (const phrase of ['previous year', 'pyq', 'asked in ugc net', 'official question']) {
    if (text.includes(phrase)) {
      fail(`${label}: original practice content must not claim to be a previous-year question (${phrase})`)
    }
  }
  const requiresVerification =
    question.presentationType === 'code' ||
    question.presentationType === 'mathematical' ||
    ['code', 'sql', 'automata', 'dfa', 'graph', 'circuit', 'boolean', 'calculation'].some(
      (tag) => hasTag(question, tag),
    )
  if (requiresVerification && !question.verification) {
    fail(`${label}: a calculation/code/SQL/automata/graph/circuit question needs verification metadata`)
  }
  if (question.verification) {
    try {
      verifyQuestion(question)
    } catch (error) {
      fail(`${label}: verification failed — ${(error as Error).message}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Load and run
// ---------------------------------------------------------------------------

const glob = new Bun.Glob('paper-*/u*-b*.ts')
const files = Array.from(glob.scanSync({ cwd: contentDir })).sort()
if (files.length === 0) {
  console.log('No bank batch files found yet.')
  process.exit(0)
}

for (const file of files) {
  const module = (await import(pathToFileURL(join(contentDir, file)).href)) as {
    questions?: UgcQuestion[]
  }
  if (!Array.isArray(module.questions)) {
    fail(`${file}: must export a named questions array`)
    continue
  }
  for (const question of module.questions) {
    if (unitFilter && question.unit !== unitFilter) continue
    questions.push({ question, file })
    validateStructure(question, file)
  }
}

const codes = new Map<string, string>()
const texts = new Map<string, string>()
for (const { question, file } of questions) {
  if (codes.has(question.code)) {
    fail(`${file}: duplicate question code ${question.code}`)
  } else {
    codes.set(question.code, file)
  }
  const normalized = normalizedQuestion(question)
  if (texts.has(normalized)) {
    fail(
      `${file}: question ${question.code} duplicates ${texts.get(normalized)} after normalisation`,
    )
  } else {
    texts.set(normalized, question.code)
  }
}

const byUnit = new Map<string, UgcQuestion[]>()
for (const { question } of questions) {
  const list = byUnit.get(question.unit) ?? []
  list.push(question)
  byUnit.set(question.unit, list)
}

for (const unit of UGC_BANK_UNITS) {
  if (unitFilter && unit.code !== unitFilter) continue
  const list = byUnit.get(unit.code) ?? []
  if (list.length !== unit.newCount) {
    fail(
      `${unit.code}: expected ${unit.newCount} new questions, found ${list.length}`,
    )
  }
  const topics = new Set(list.map((question) => normalize(question.topic)))
  const subtopics = new Set(list.map((question) => normalize(question.subtopic)))
  if (topics.size < 4) fail(`${unit.code}: expected at least 4 distinct topics, found ${topics.size}`)
  if (subtopics.size < 6) {
    fail(`${unit.code}: expected at least 6 distinct subtopics, found ${subtopics.size}`)
  }
  const questionTypes = new Set(list.map((question) => question.questionType))
  if (questionTypes.size < 3) {
    fail(`${unit.code}: expected at least 3 question types, found ${questionTypes.size}`)
  }
  const cognitiveSkills = new Set(list.map((question) => question.cognitiveSkill))
  if (cognitiveSkills.size < 4) {
    fail(
      `${unit.code}: expected at least 4 cognitive skills, found ${cognitiveSkills.size}`,
    )
  }
  const presentationTypes = new Set(list.map((question) => question.presentationType))
  if (presentationTypes.size < 2) {
    fail(`${unit.code}: expected at least 2 presentation types`)
  }
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 }
  for (const question of list) difficultyCounts[question.difficulty] += 1
  for (const [difficulty, count] of Object.entries(difficultyCounts)) {
    if (count < Math.ceil(list.length * 0.15)) {
      fail(
        `${unit.code}: too few ${difficulty} questions (${count}/${list.length}); aim for a balanced paper`,
      )
    }
  }
  const answerCounts = { A: 0, B: 0, C: 0, D: 0 }
  for (const question of list) answerCounts[question.correctAnswer] += 1
  for (const [option, count] of Object.entries(answerCounts)) {
    if (count === 0) fail(`${unit.code}: no correct answer uses option ${option}`)
    if (count > Math.ceil(list.length * 0.5)) {
      warn(`${unit.code}: option ${option} is the answer ${count} times`)
    }
  }
  for (const requirement of UGC_BANK_REQUIRED_TAGS[unit.code] ?? []) {
    const count = list.filter((question) => hasTag(question, requirement.tag)).length
    if (count < requirement.min) {
      fail(
        `${unit.code}: tag "${requirement.tag}" needs at least ${requirement.min} questions, found ${count}`,
      )
    }
  }
}

if (verbose) {
  for (const warning of warnings) console.log(`WARN  ${warning}`)
}

if (failures.length > 0) {
  console.error(`\nUGC bank validation failed with ${failures.length} issue(s):`)
  for (const failure of failures) console.error(`  FAIL  ${failure}`)
  process.exit(1)
}

console.log(
  `UGC bank validation passed: ${questions.length} questions across ${byUnit.size} units.`,
)
for (const unit of UGC_BANK_UNITS) {
  if (unitFilter && unit.code !== unitFilter) continue
  const list = byUnit.get(unit.code) ?? []
  console.log(
    `  ${unit.code} ${unit.shortName}: ${list.length} new (target ${unit.targetTotal} total)`,
  )
}
