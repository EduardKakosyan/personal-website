import { ContactForm } from '@/components/features/contact-form'
import { Mail, Linkedin, Github } from 'lucide-react' // Using lucide-react icons
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Me | AI Developer',
  description: 'Get in touch with me. Send a message or find me on other platforms.',
}

const contactDetails = [
  {
    icon: Mail,
    text: 'your-email@example.com', // Replace with actual email
    href: 'mailto:your-email@example.com', // Replace with actual email
    label: 'Email',
  },
  {
    icon: Linkedin,
    text: 'linkedin.com/in/yourprofile', // Replace with actual LinkedIn profile
    href: 'https://linkedin.com/in/yourprofile', // Replace with actual LinkedIn profile
    label: 'LinkedIn',
  },
  {
    icon: Github,
    text: 'github.com/yourusername', // Replace with actual GitHub username
    href: 'https://github.com/yourusername', // Replace with actual GitHub username
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

        <div>
          <ContactForm />
        </div>
      </div>
    </div>
  )
} 