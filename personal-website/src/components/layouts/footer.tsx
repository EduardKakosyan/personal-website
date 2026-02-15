import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SocialLinks } from '@/components/features/social-links'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const navigationLinks = [
    { name: 'About', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Main footer content - horizontal on desktop, vertical on mobile */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-12">
          {/* Quick links */}
          <div className="space-y-4 md:flex-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
              Navigation
            </h4>
            <nav className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-4">
              {navigationLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-sm text-muted-foreground hover:text-foreground transition-colors',
                    'touch-target flex items-center gap-1 haptic-light w-fit',
                  )}
                >
                  {link.name}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </nav>
          </div>

          {/* Social links */}
          <SocialLinks />
        </div>

        {/* Bottom section */}
        <div className="border-t border-border/40 mt-8 pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              &copy; {currentYear} Eduard Kakosyan. All rights reserved.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-2 md:gap-4 text-xs text-muted-foreground">
              <span>Made with ❤️ in Halifax, NS</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden sm:inline">Built with Next.js & Tailwind CSS</span>
            </div>
          </div>
        </div>

        {/* Mobile-only bottom padding for chat button */}
        <div className="md:hidden h-20" />
      </div>
    </footer>
  )
}
