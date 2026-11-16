/**
 * Candidate identity for examination attempts.
 *
 * The display id is deterministic for a user so refreshing or resuming an
 * attempt shows the same roll number. It is not an authentication credential.
 */

import { getServerSession } from 'next-auth'
import { authOptions, getCurrentUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import type { CbtCandidate } from './types'

function stableHash(value: string): number {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

export function candidateIdFor(userId: string, year = new Date().getFullYear()): string {
  const suffix = String(stableHash(userId) % 1_000_000).padStart(6, '0')
  return `NETP-${year}-${suffix}`
}

export interface CbtIdentity {
  userId: string
  candidate: CbtCandidate
}

export async function getCbtIdentity(): Promise<CbtIdentity> {
  const session = await getServerSession(authOptions)
  const userId = await getCurrentUserId(session)

  let profileName: string | null = null
  if (userId !== 'demo-user') {
    const profile = await db.userProfile
      .findUnique({ where: { userId }, select: { name: true } })
      .catch(() => null)
    profileName = profile?.name ?? null
  } else {
    const demoProfile = await db.userProfile
      .findFirst({ where: { userId: 'demo-user' }, select: { name: true } })
      .catch(() => null)
    profileName = demoProfile?.name ?? null
  }

  const name =
    profileName?.trim() ||
    session?.user?.name?.trim() ||
    'Candidate'

  return {
    userId,
    candidate: {
      name,
      id: candidateIdFor(userId),
    },
  }
}
