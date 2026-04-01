import { Mail, Linkedin, Github, MapPin, Calendar, Coffee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Me | Eduard Kakosyan',
  description: 'Get in touch with me. Send a message or find me on other platforms.',
}

const contactDetails = [
  {
    icon: Mail,
    text: 'eduard@ai-first.ca',
    href: 'mailto:eduard@ai-first.ca',
    label: 'Email',
    description: 'Best way to reach me for business inquiries',
  },
  {
    icon: Linkedin,
    text: 'eduard-kakosyan',
    href: 'https://linkedin.com/in/eduard-kakosyan',
    label: 'LinkedIn',
    description: 'Professional networking and updates',
  },
  {
    icon: Github,
    text: 'eduardkakosyan',
    href: 'https://github.com/eduardkakosyan',
    label: 'GitHub',
    description: 'Open source projects and code samples',
  },
  {
    icon: MapPin,
    text: 'Halifax, Nova Scotia',
    href: 'https://maps.google.com?q=Halifax,Nova Scotia',
    label: 'Location',
    description: 'Available for local meetups and remote work',
  },
]

const collaborationOptions = [
  {
    icon: Coffee,
    title: 'AI Consultation',
    description:
      'I help businesses figure out where AI actually fits — from agent prototypes to production deployments.',
  },
  {
    icon: Calendar,
    title: 'Hackathon Partner',
    description:
      'I compete in hackathons regularly around Atlantic Canada. If you need a teammate, reach out.',
  },
  {
    icon: Github,
    title: 'Open Source',
    description: 'Most of my projects are public on GitHub. PRs and ideas are always welcome.',
  },
]

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-16 max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Contact & Collaboration</h1>
        <p className="mt-3 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
          The best way to reach me is through{' '}
          <a
            href="https://linkedin.com/in/eduard-kakosyan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            LinkedIn
          </a>
          . I&apos;m always open to chatting about AI projects, hackathons, or new ideas.
        </p>
      </div>

      <div className="space-y-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
              {contactDetails.map((item) => (
                <Card key={item.label} className="p-4">
                  <div className="flex items-start gap-4">
                    <item.icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm">{item.label}</h3>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-sm"
                      >
                        {item.text}
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Collaboration Options */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Collaboration Areas</h2>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 max-w-4xl mx-auto">
              {collaborationOptions.map((option, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <option.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm leading-relaxed text-center md:text-left">
                      {option.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
