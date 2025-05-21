import { Mail, Linkedin, Github } from 'lucide-react'
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
  },
  {
    icon: Linkedin,
    text: 'linkedin.com/in/eduard-kakosyan',
    href: 'https://linkedin.com/in/eduard-kakosyan',
    label: 'LinkedIn',
  },
  {
    icon: Github,
    text: 'github.com/eduardkakosyan',
    href: 'https://github.com/eduardkakosyan',
    label: 'GitHub',
  },
]

export default function ContactPage() {
  return (
    <div className='container py-12 md:py-16'>
      <div className='mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl'>
          Let&apos;s Connect
        </h1>
        <p className='mt-3 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl'>
          I&apos;m always open to discussing new projects, creative ideas, or opportunities to collaborate.
        </p>
      </div>

      <div className='grid gap-12 md:grid-cols-2'>
        <div className='space-y-6'>
          <h2 className='text-2xl font-semibold'>Contact Information</h2>
          <ul className='space-y-4'>
            {contactDetails.map((item) => (
              <li key={item.label} className='flex items-start gap-3'>
                <item.icon className='h-6 w-6 text-primary flex-shrink-0 mt-1' />
                <div>
                  <h3 className='font-medium'>{item.label}</h3>
                  <a
                    href={item.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-muted-foreground hover:text-primary transition-colors'
                  >
                    {item.text}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
} 