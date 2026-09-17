"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** True once the component is running on the client (SSR: false). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * Reads a browser-only value (UA, localStorage, URL…) with correct SSR
 * hydration semantics — no effects, no setState-in-effect, no mismatch.
 *
 * IMPORTANT: `read` must return a primitive (boolean/number/string) so the
 * snapshot stays referentially stable between renders.
 */
export function useBrowserValue<T extends string | number | boolean | null>(
  read: () => T,
  serverValue: T
): T {
  // getSnapshot may change identity between renders — React only compares
  // returned values, so no ref bookkeeping is needed here.
  return useSyncExternalStore(
    noopSubscribe,
    read,
    () => serverValue
  );
}
