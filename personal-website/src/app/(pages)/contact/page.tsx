import { Mail, Linkedin, Github, MapPin, Calendar, Coffee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with me. Send a message or find me on other platforms.',
}

const contactDetails = [
  {
    icon: Mail,
    text: 'eduard@ai-first.ca',
    href: 'mailto:eduard@ai-first.ca',
    label: 'Email',
    description: 'For questions about my work or a project',
  },
  {
    icon: Linkedin,
    text: 'eduard-kakosyan',
    href: 'https://linkedin.com/in/eduard-kakosyan',
    label: 'LinkedIn',
    description: 'You can message me here too',
  },
  {
    icon: Github,
    text: 'eduardkakosyan',
    href: 'https://github.com/eduardkakosyan',
    label: 'GitHub',
    description: 'Code for the projects on this site',
  },
  {
    icon: MapPin,
    text: 'Halifax, Nova Scotia',
    href: 'https://maps.google.com?q=Halifax,Nova Scotia',
    label: 'Location',
    description: 'Where I’m based',
  },
]

const collaborationOptions = [
  {
    icon: Coffee,
    title: 'AI at work',
    description:
      'At AI-First Consulting, I build AI tools for businesses. Get in touch if you have a workflow you want help with.',
  },
  {
    icon: Calendar,
    title: 'Hackathons',
    description:
      'I take part in hackathons around Atlantic Canada. Let me know if you’re putting a team together.',
  },
  {
    icon: Github,
    title: 'Open source',
    description:
      'If you’ve tried one of my projects, I’d like to hear how it went. You can open an issue or a pull request on GitHub.',
  },
]

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-16 max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Say hello</h1>
        <p className="mt-3 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
          You can find me on{' '}
          <a
            href="https://linkedin.com/in/eduard-kakosyan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            LinkedIn
          </a>{' '}
          or send me an email. Questions about a project, hackathon plans, and ideas are welcome.
        </p>
      </div>

      <div className="space-y-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Where to find me</h2>
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
            <h2 className="text-2xl font-semibold mb-6">A few things we could work on</h2>
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
