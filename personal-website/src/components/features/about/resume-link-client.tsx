'use client'
import { analyticsEvents } from '@/lib/analytics'

export function ResumeLinkClient({ resumePdfPath }: { resumePdfPath: string }) {
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
