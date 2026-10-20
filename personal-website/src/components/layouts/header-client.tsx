'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowDown } from 'lucide-react'
import type { identity as ProfileIdentity } from '@/content/profile'
import { analyticsEvents } from '@/lib/analytics'

export function HeaderClient({
  identity,
  resumePdfPath,
}: {
  identity: Pick<typeof ProfileIdentity, 'name' | 'title' | 'company'>
  resumePdfPath: string
}) {
  const pathname = usePathname()
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          href="/"
          className="site-wordmark"
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          <span className="site-monogram" aria-hidden="true" />
          <span>
            <strong>{identity.name}</strong>
            <small>
              {identity.title} at {identity.company}
            </small>
          </span>
          <span className="sr-only"> home</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link
            href="/projects"
            aria-current={pathname.startsWith('/projects') ? 'page' : undefined}
          >
            Work
          </Link>
          <Link href="/about" aria-current={pathname === '/about' ? 'page' : undefined}>
            About
          </Link>
          <Link href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined}>
            Contact
          </Link>
          <a
            href={resumePdfPath}
            download
            className="site-nav-resume"
            aria-current={pathname === resumePdfPath ? 'page' : undefined}
            aria-label="Download résumé (PDF)"
            onClick={() => analyticsEvents.resumeDownloaded()}
          >
            Résumé
            <ArrowDown size={12} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  )
}
