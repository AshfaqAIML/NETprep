import { MetadataRoute } from 'next'

/**
 * /sitemap.xml — auto-generated sitemap for SEO.
 *
 * Since the app is a single-page application with client-side routing,
 * we expose the main entry point. For a multi-page deployment, this file
 * would enumerate all public content URLs (subjects, notes, articles, etc.).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]
}
