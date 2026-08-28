/**
 * EmailService — provider-neutral email abstraction.
 *
 * Providers:
 *   - "none" (default): no-op, logs to console (dev mode)
 *   - "smtp": standard SMTP using nodemailer
 *   - "resend": Resend HTTP API
 *
 * All providers implement the same interface, so switching is purely
 * an environment variable change.
 */

export interface EmailMessage {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  replyTo?: string
}

export interface EmailAdapter {
  readonly provider: string
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>
  isConfigured(): boolean
}

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

let _instance: EmailAdapter | null = null

export function getEmailProvider(): EmailAdapter {
  if (_instance) return _instance

  const provider = (process.env.EMAIL_PROVIDER ?? 'none').toLowerCase()

  switch (provider) {
    case 'smtp':
      _instance = new SmtpEmailAdapter()
      break
    case 'resend':
      _instance = new ResendEmailAdapter()
      break
    case 'none':
    default:
      _instance = new NoopEmailAdapter()
      break
  }

  return _instance
}

// ---------------------------------------------------------------------------
// Noop adapter (default — app works without email configured)
// ---------------------------------------------------------------------------

export class NoopEmailAdapter implements EmailAdapter {
  readonly provider = 'none'

  async send(message: EmailMessage) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[EmailService:noop] Would send:', {
        to: message.to,
        subject: message.subject,
        textPreview: message.text?.substring(0, 100),
      })
    }
    return { success: true, messageId: `noop-${Date.now()}` }
  }

  isConfigured() {
    return false
  }
}

// ---------------------------------------------------------------------------
// SMTP adapter (standard, works with any SMTP server)
// ---------------------------------------------------------------------------

export class SmtpEmailAdapter implements EmailAdapter {
  readonly provider = 'smtp'
  private host: string
  private port: number
  private user: string
  private pass: string
  private from: string

  constructor() {
    this.host = process.env.SMTP_HOST ?? ''
    this.port = parseInt(process.env.SMTP_PORT ?? '587', 10)
    this.user = process.env.SMTP_USER ?? ''
    this.pass = process.env.SMTP_PASSWORD ?? ''
    this.from = process.env.SMTP_FROM ?? 'NETPrep Hub <noreply@netprephub.local>'

    if (!this.host || !this.user || !this.pass) {
      console.warn('[EmailService:smtp] SMTP_HOST, SMTP_USER, or SMTP_PASSWORD not set — email will fail')
    }
  }

  isConfigured() {
    return !!(this.host && this.user && this.pass)
  }

  private async getTransport() {
    const nodemailer = await import('nodemailer')
    return nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.port === 465,
      auth: { user: this.user, pass: this.pass },
    })
  }

  async send(message: EmailMessage) {
    if (!this.isConfigured()) {
      return { success: false, error: 'SMTP not configured' }
    }
    try {
      const transport = await this.getTransport()
      const info = await transport.sendMail({
        from: message.from ?? this.from,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
      })
      return { success: true, messageId: info.messageId }
    } catch (e: any) {
      console.error('[EmailService:smtp] send failed:', e.message)
      return { success: false, error: e.message }
    }
  }
}

// ---------------------------------------------------------------------------
// Resend adapter (modern email API — https://resend.com)
// ---------------------------------------------------------------------------

export class ResendEmailAdapter implements EmailAdapter {
  readonly provider = 'resend'
  private apiKey: string
  private from: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY ?? ''
    this.from = process.env.RESEND_FROM ?? 'NETPrep Hub <noreply@netprephub.local>'

    if (!this.apiKey) {
      console.warn('[EmailService:resend] RESEND_API_KEY not set — email will fail')
    }
  }

  isConfigured() {
    return !!this.apiKey
  }

  async send(message: EmailMessage) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Resend API key not configured' }
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from ?? this.from,
          to: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
          reply_to: message.replyTo,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        return { success: false, error: `Resend API error: ${err}` }
      }
      const data = await res.json()
      return { success: true, messageId: data.id }
    } catch (e: any) {
      console.error('[EmailService:resend] send failed:', e.message)
      return { success: false, error: e.message }
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience singleton
// ---------------------------------------------------------------------------

export const email = getEmailProvider()
