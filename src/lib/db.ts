import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

/**
 * Neon's pooler can occasionally fail to hand out a connection within the
 * Prisma pool timeout (P2024), especially on the first query after the compute
 * wakes up. The query never reaches the database, so retrying it is safe.
 */
function isPoolTimeout(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2024'
  )
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.PRISMA_LOG_QUERIES === '1'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 1; ; attempt += 1) {
          try {
            return await query(args)
          } catch (error) {
            if (attempt >= 3 || !isPoolTimeout(error)) throw error
            await new Promise((resolve) => setTimeout(resolve, attempt * 500))
          }
        }
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
