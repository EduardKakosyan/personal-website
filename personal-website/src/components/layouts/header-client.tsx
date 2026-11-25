'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { identity as ProfileIdentity } from '@/content/profile'
import { analyticsEvents } from '@/lib/analytics'

/** The plain pages' header: the name, as the game writes it, and a bar like the game's corner bar. */
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
          <strong>{identity.name}</strong>
          <small>
            {identity.title} at {identity.company}
          </small>
          <span className="sr-only"> home</span>
        </Link>
        <nav className="site-bar" aria-label="Main navigation">
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
            <span aria-hidden="true">←</span> Cabin
          </Link>
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
            className="site-bar-resume"
            aria-current={pathname === resumePdfPath ? 'page' : undefined}
            aria-label="Download résumé (PDF)"
            onClick={() => analyticsEvents.resumeDownloaded()}
          >
            Résumé <span aria-hidden="true">↓</span>
          </a>
        </nav>
      </div>
    </header>
  )
}
