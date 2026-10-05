'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  return (
    <header className="lab-header" data-tone={pathname === '/' ? 'dark' : 'light'}>
      <div className="lab-header-inner">
        <Link href="/" className="lab-wordmark" aria-label="Eduard Kakosyan home">
          <span className="lab-monogram">ek.</span>
          <span>
            <strong>Eduard Kakosyan</strong>
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
        </nav>
      </div>
    </header>
  )
}
