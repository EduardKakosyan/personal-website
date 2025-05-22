import { Mail, Linkedin, Github, MapPin, Calendar, Coffee } from 'lucide-react'
import { ContactForm } from '@/components/features/contact-form'
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
    description: 'Best way to reach me for business inquiries'
  },
  {
    icon: Linkedin,
    text: 'eduard-kakosyan',
    href: 'https://linkedin.com/in/eduard-kakosyan',
    label: 'LinkedIn',
    description: 'Professional networking and updates'
  },
  {
    icon: Github,
    text: 'eduardkakosyan',
    href: 'https://github.com/eduardkakosyan',
    label: 'GitHub',
    description: 'Open source projects and code samples'
  },
  {
    icon: MapPin,
    text: 'Halifax, Nova Scotia',
    href: 'https://maps.google.com?q=Halifax,Nova Scotia',
    label: 'Location',
    description: 'Available for local meetups and remote work'
  },
]

const collaborationOptions = [
  {
    icon: Coffee,
    title: 'AI Consultation',
    description: 'Need help integrating AI into your business? I can discuss your technical requirements and implementation options.',
    action: 'Schedule a Call'
  },
  {
    icon: Calendar,
    title: 'Hackathon Partner',
    description: 'Looking for a teammate for your next hackathon? I participate in various competitive programming events.',
    action: 'Team Up'
  },
  {
    icon: Github,
    title: 'Open Source Collaboration',
    description: 'Interested in contributing to AI projects or need assistance with machine learning implementations?',
    action: 'Contribute Together'
  },
]

export default function ContactPage() {
  return (
    <div className='container py-12 md:py-16 max-w-6xl'>
      <div className='mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl'>
          Contact & Collaboration
        </h1>
        <p className='mt-3 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl'>
          Whether you need AI consultation, want to partner on a hackathon, or have a project idea, 
          I'm available to discuss potential collaboration opportunities.
        </p>
      </div>

      <div className='grid gap-12 lg:grid-cols-2'>
        {/* Contact Form */}
        <div className='space-y-6'>
          <ContactForm />
        </div>

        {/* Contact Information */}
        <div className='space-y-8'>
          <div>
            <h2 className='text-2xl font-semibold mb-6'>Get in Touch</h2>
            <div className='grid gap-4'>
              {contactDetails.map((item) => (
                <Card key={item.label} className='p-4'>
                  <div className='flex items-start gap-4'>
                    <item.icon className='h-5 w-5 text-primary flex-shrink-0 mt-1' />
                    <div className='min-w-0 flex-1'>
                      <h3 className='font-medium text-sm'>{item.label}</h3>
                      <a
                        href={item.href}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:underline font-mono text-sm'
                      >
                        {item.text}
                      </a>
                      <p className='text-xs text-muted-foreground mt-1'>{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Collaboration Options */}
          <div>
            <h2 className='text-2xl font-semibold mb-6'>Collaboration Areas</h2>
            <div className='space-y-4'>
              {collaborationOptions.map((option, index) => (
                <Card key={index}>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center gap-3'>
                      <option.icon className='h-5 w-5 text-primary' />
                      <CardTitle className='text-lg'>{option.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <CardDescription className='text-sm leading-relaxed'>
                      {option.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Response Expectation */}
      <div className='mt-16 text-center'>
        <Card className='max-w-2xl mx-auto bg-muted/40'>
          <CardContent className='p-6'>
            <h3 className='font-semibold text-lg mb-2'>Response Time</h3>
            <p className='text-muted-foreground text-sm'>
              I typically respond to emails within 24-48 hours. For urgent matters, 
              mention it in your subject line.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 