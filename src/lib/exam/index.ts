/**
 * Centralized examination blueprint and configuration engine.
 *
 * This barrel is the public entry point for server code, admin tooling and
 * tests. Everything here is pure TypeScript; persistence adapters live outside
 * this module.
 */

export * from './types'
export * from './fractions'
export * from './blueprint'
export * from './schema'
export * from './validate'
export * from './paper'
export * from './scoring'
export * from './registry'
export * from './profiles'
