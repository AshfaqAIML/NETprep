/**
 * Type declarations for optional peer dependencies.
 *
 * These packages are only loaded dynamically when the corresponding provider
 * is selected via environment variables. They are NOT required for the default
 * (local/noop) configuration.
 *
 * Install them only if you use the relevant provider:
 *   - @aws-sdk/client-s3  → when STORAGE_PROVIDER=s3
 *   - nodemailer           → when EMAIL_PROVIDER=smtp
 */

declare module 'nodemailer' {
  export interface Transporter {
    sendMail(options: {
      from?: string
      to: string
      subject: string
      text?: string
      html?: string
      replyTo?: string
    }): Promise<{ messageId: string }>
  }
  export function createTransport(options: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }): Transporter
}

declare module '@aws-sdk/client-s3' {
  export class S3Client {
    constructor(config: {
      region: string
      endpoint?: string
      forcePathStyle?: boolean
      credentials: { accessKeyId: string; secretAccessKey: string }
    })
    send<T = any>(command: any): Promise<T>
  }
  export class PutObjectCommand {
    constructor(input: {
      Bucket: string
      Key: string
      Body: Buffer | Uint8Array | string
      ContentType?: string
      ContentLength?: number
    })
  }
  export class DeleteObjectCommand {
    constructor(input: { Bucket: string; Key: string })
  }
  export class HeadObjectCommand {
    constructor(input: { Bucket: string; Key: string })
  }
  export class GetObjectCommand {
    constructor(input: { Bucket: string; Key: string })
  }
}
