'use client'
import { resumePdfPath } from '@/content/profile'
import { analyticsEvents } from '@/lib/analytics'

export function ResumeLink() {
  return (
    <a
      className="site-button"
      href={resumePdfPath}
      download
      onClick={() => analyticsEvents.resumeDownloaded()}
    >
      Résumé ↓ <span className="site-kicker">PDF</span>
    </a>
  )
}
