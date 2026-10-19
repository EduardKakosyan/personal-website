'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { identity, resumePdfPath } from '@/content/profile'
import { analyticsEvents } from '@/lib/analytics'

export function Header() {
  const pathname = usePathname()
  return (
    <header className="lab-header" data-tone={pathname === '/' ? 'dark' : 'light'}>
      <div className="lab-header-inner">
        <Link href="/" className="lab-wordmark" aria-label={`${identity.name} home`}>
          <span className="lab-monogram">ek.</span>
          <span>
            <strong>{identity.name}</strong>
            <small>AI ENGINEER & BUILDER</small>
          </span>
        </Link>
        <nav className="lab-nav" aria-label="Main navigation">
          <Link
            href="/projects"
            aria-current={pathname.startsWith('/projects') ? 'page' : undefined}
          >
            Work
          </Link>
          <Link href="/#about">About</Link>
          <span className="nav-divider" />
          <Link href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined}>
            Let’s talk
            <ArrowUpRight size={12} />
          </Link>
          <a
            href={resumePdfPath}
            download
            className="lab-nav-resume"
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
