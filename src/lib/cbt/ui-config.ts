/**
 * CBT client timing and autosave configuration.
 *
 * These values control presentation and client-side persistence only. The
 * examination duration and expiry are always owned by the server.
 */

/** Seconds remaining at which a warning is shown. */
export const CBT_TIME_WARNINGS_SEC = [900, 300, 60] as const

/** Debounce for response autosave. */
export const CBT_AUTOSAVE_DEBOUNCE_MS = 700

/** Server clock synchronization interval. */
export const CBT_HEARTBEAT_INTERVAL_MS = 30_000

/** Show the timer in red at or below this many seconds. */
export const CBT_CRITICAL_TIME_SEC = 300
