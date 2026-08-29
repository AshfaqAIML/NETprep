import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

/**
 * NextAuth configuration for NETPrep Hub.
 *
 * Supports:
 * - Credentials (email + password) — always available
 * - Google OAuth — when GOOGLE_CLIENT_ID is set
 * - GitHub OAuth — when GITHUB_CLIENT_ID is set
 *
 * Falls back to demo-user mode when AUTH_SECRET is not configured.
 */

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any) as any,
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as any
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id as string
        token.role = ((user as any).role || 'student') as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
      }
      return session
    },
  },
}

/**
 * Get the current user ID from a session, or fall back to demo-user.
 * This allows the app to work without authentication configured.
 */
export async function getCurrentUserId(session: any): Promise<string> {
  if (session?.user?.id) {
    return session.user.id
  }
  return 'demo-user'
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Register a new user with email and password.
 */
export async function registerUser(email: string, password: string, name?: string) {
  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  if (existing) {
    throw new Error('Email already registered')
  }

  const passwordHash = await hashPassword(password)
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      passwordHash,
      role: 'student',
    },
  })

  // Create a default profile for this user
  await db.userProfile.create({
    data: {
      userId: user.id,
      name: user.name || 'Student',
    },
  })

  return user
}
