import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'

/**
 * POST /api/auth/register
 * Body: { email, password, name? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      )
    }

    const user = await registerUser(email, password, name)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Email already registered') {
      return NextResponse.json({ error: e.message }, { status: 409 })
    }
    console.error('[api/auth/register] error', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
