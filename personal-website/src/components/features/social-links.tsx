'use client'

import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyticsEvents } from '@/lib/analytics'

interface SocialLink {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}

export function SocialLinks() {
  const socialLinks: SocialLink[] = [
    {
      name: 'GitHub',
      href: 'https://github.com/eduardkakosyan',
      icon: Github,
      label: 'View my code on GitHub',
      onClick: () => analyticsEvents.githubClicked(),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/eduard-kakosyan',
      icon: Linkedin,
      label: 'Connect with me on LinkedIn',
      onClick: () => analyticsEvents.linkedinClicked(),
    },
    {
      name: 'Email',
      href: 'mailto:eduard@ai-first.ca',
      icon: Mail,
      label: 'Send me an email',
      onClick: () => analyticsEvents.emailClicked(),
    },
  ]

  return (
    <div className="space-y-4 md:flex-shrink-0">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Connect
      </h4>
      <div className="flex flex-col md:flex-row gap-3 md:gap-6">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target={social.href.startsWith('mailto:') ? undefined : '_blank'}
            rel={social.href.startsWith('mailto:') ? undefined : 'noreferrer'}
            aria-label={social.label}
            className={cn(
              'inline-flex items-center gap-3 md:gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200',
              'touch-target haptic-light group w-fit',
            )}
            onClick={social.onClick}
          >
            <social.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="md:sr-only">{social.name}</span>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity md:hidden" />
          </a>
        ))}
      </div>
    </div>
  )
}
