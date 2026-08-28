/**
 * StorageService — provider-neutral file storage abstraction.
 *
 * The application talks to this interface. The concrete implementation is
 * selected at runtime via the STORAGE_PROVIDER environment variable.
 *
 * Supported providers:
 *   - "local" (default): writes to the local filesystem
 *   - "s3": any S3-compatible service (AWS S3, Cloudflare R2, Backblaze B2, MinIO)
 *
 * Adding a new provider:
 *   1. Implement the StorageAdapter interface below.
 *   2. Add a case in `getStorageProvider()`.
 *   3. Document the required environment variables in .env.example.
 */

export interface UploadedFile {
  name: string
  size: number
  type: string
  data: Buffer
}

export interface StoredFile {
  key: string
  url: string
  size: number
  type: string
  provider: string
}

export interface StorageAdapter {
  readonly provider: string
  upload(file: UploadedFile, key?: string): Promise<StoredFile>
  getUrl(key: string): Promise<string>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  read(key: string): Promise<Buffer>
}

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

let _instance: StorageAdapter | null = null

export function getStorageProvider(): StorageAdapter {
  if (_instance) return _instance

  const provider = (process.env.STORAGE_PROVIDER ?? 'local').toLowerCase()

  switch (provider) {
    case 's3':
      _instance = new S3StorageAdapter()
      break
    case 'local':
    default:
      _instance = new LocalStorageAdapter()
      break
  }

  return _instance
}

// ---------------------------------------------------------------------------
// Local filesystem adapter (default — works everywhere, zero config)
// ---------------------------------------------------------------------------

import * as fs from 'fs/promises'
import * as path from 'path'
import { randomUUID } from 'crypto'

export class LocalStorageAdapter implements StorageAdapter {
  readonly provider = 'local'
  private basePath: string
  private publicPrefix: string

  constructor() {
    this.basePath = process.env.STORAGE_LOCAL_PATH ?? './public/uploads'
    this.publicPrefix = '/uploads'
  }

  async upload(file: UploadedFile, key?: string): Promise<StoredFile> {
    const finalKey = key ?? `${randomUUID()}-${file.name}`
    const fullPath = path.join(this.basePath, finalKey)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, file.data)
    return {
      key: finalKey,
      url: `${this.publicPrefix}/${finalKey}`,
      size: file.size,
      type: file.type,
      provider: this.provider,
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${this.publicPrefix}/${key}`
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key)
    try {
      await fs.unlink(fullPath)
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, key)
    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  async read(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key)
    return fs.readFile(fullPath)
  }
}

// ---------------------------------------------------------------------------
// S3-compatible adapter (AWS S3, Cloudflare R2, Backblaze B2, MinIO)
// ---------------------------------------------------------------------------

export class S3StorageAdapter implements StorageAdapter {
  readonly provider = 's3'
  private bucket: string
  private region: string
  private endpoint: string | undefined
  private forcePathStyle: boolean

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? ''
    this.region = process.env.S3_REGION ?? 'us-east-1'
    this.endpoint = process.env.S3_ENDPOINT || undefined
    this.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true'

    if (!this.bucket) {
      throw new Error(
        'S3StorageAdapter requires S3_BUCKET. Set STORAGE_PROVIDER=local for local filesystem.',
      )
    }
  }

  /**
   * Lazily create the S3 client using the AWS SDK v3.
   * The @aws-sdk/client-s3 package must be installed when STORAGE_PROVIDER=s3.
   * We import dynamically so the local-only deployment doesn't require it.
   */
  private async getClient() {
    const { S3Client } = await import('@aws-sdk/client-s3')
    return new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
    })
  }

  async upload(file: UploadedFile, key?: string): Promise<StoredFile> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const finalKey = key ?? `${randomUUID()}-${file.name}`
    const client = await this.getClient()

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: finalKey,
        Body: file.data,
        ContentType: file.type,
        ContentLength: file.size,
      }),
    )

    const url = this.endpoint && this.forcePathStyle
      ? `${this.endpoint}/${this.bucket}/${finalKey}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${finalKey}`

    return {
      key: finalKey,
      url,
      size: file.size,
      type: file.type,
      provider: this.provider,
    }
  }

  async getUrl(key: string): Promise<string> {
    if (this.endpoint && this.forcePathStyle) {
      return `${this.endpoint}/${this.bucket}/${key}`
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async exists(key: string): Promise<boolean> {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    try {
      await client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return true
    } catch {
      return false
    }
  }

  async read(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    const response = await client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    const bytes = await response.Body!.transformToByteArray()
    return Buffer.from(bytes)
  }
}

// ---------------------------------------------------------------------------
// Convenience singleton
// ---------------------------------------------------------------------------

export const storage = getStorageProvider()
