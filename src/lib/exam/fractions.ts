/**
 * Exact rational arithmetic for marking.
 *
 * GATE deducts 1/3 and 2/3 marks. Floating point arithmetic produces values
 * such as 0.3333333333333333 and can silently fail equality/sum checks, so the
 * engine stores every score as a reduced fraction and only converts to a
 * decimal at the display boundary.
 */

import type { Rational } from './types'

export interface Fraction {
  readonly n: number
  readonly d: number
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = x % y
    x = y
    y = t
  }
  return x || 1
}

export function frac(n: number, d = 1): Fraction {
  if (!Number.isFinite(n) || !Number.isFinite(d)) {
    throw new Error(`Invalid fraction ${n}/${d}`)
  }
  if (d === 0) throw new Error('Fraction denominator cannot be zero')
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    // Callers only use integers; scale decimals defensively if that changes.
    const scale = 1_000_000
    n = Math.round(n * scale)
    d = Math.round(d * scale)
  }
  if (d < 0) {
    n = -n
    d = -d
  }
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

export const ZERO = frac(0)
export const ONE = frac(1)

export function add(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d)
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d)
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.n, a.d * b.d)
}

export function div(a: Fraction, b: Fraction): Fraction {
  if (b.n === 0) throw new Error('Division by zero fraction')
  return frac(a.n * b.d, a.d * b.n)
}

export function neg(a: Fraction): Fraction {
  return frac(-a.n, a.d)
}

export function isZero(a: Fraction): boolean {
  return a.n === 0
}

export function compare(a: Fraction, b: Fraction): number {
  const left = a.n * b.d
  const right = b.n * a.d
  return left === right ? 0 : left < right ? -1 : 1
}

export function toNumber(a: Fraction): number {
  return a.n / a.d
}

/**
 * Round a fraction to `decimals` places. Default mode is half-away-from-zero,
 * which is predictable for negative marks.
 */
export function roundFraction(
  value: Fraction,
  decimals: number,
  mode: 'half-away-from-zero' | 'truncate' = 'half-away-from-zero',
): number {
  const places = Math.max(0, Math.min(6, Math.trunc(decimals)))
  const factor = 10 ** places
  const scaled = (value.n * factor) / value.d
  if (mode === 'truncate') {
    return Math.trunc(scaled) / factor
  }
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled))
  return rounded / factor
}

export function fromRational(value: Rational): Fraction {
  return frac(value.numerator, value.denominator)
}

export function toRational(value: Fraction): Rational {
  return { numerator: value.n, denominator: value.d }
}

export function fractionToString(value: Fraction): string {
  return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`
}
