import { NextResponse } from 'next/server'
import { CbtAttemptError } from './attempt'
import { CbtContentError } from './paper-builder'
import { CbtSelectionError } from './selection'

export function cbtErrorResponse(error: unknown): NextResponse {
  if (error instanceof CbtAttemptError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    )
  }
  if (error instanceof CbtContentError || error instanceof CbtSelectionError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error instanceof CbtSelectionError ? 'CBT_SELECTION_ERROR' : 'CBT_CONTENT_ERROR',
        ...(error instanceof CbtContentError && error.issues.length > 0
          ? { issues: error.issues }
          : {}),
      },
      { status: 409 },
    )
  }
  console.error('[api/exams] unhandled error', error)
  return NextResponse.json(
    { error: 'The examination service could not complete the request' },
    { status: 500 },
  )
}
