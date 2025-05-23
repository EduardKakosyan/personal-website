'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function ContactForm() {
  const [status, setStatus] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('Sending...')
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const message = formData.get('message') as string

    if (name && email && message) {
      const subject = encodeURIComponent(`Contact Form Submission from ${name}`)
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)
      window.location.href = `mailto:eduard@ai-first.ca?subject=${subject}&body=${body}`
      setStatus('Your message has been prepared. Please send it through your email client.')
    } else {
      setStatus('Please fill out all fields.')
    }
  }

  return (
    <Card className='w-full max-w-lg mx-auto'>
      <CardHeader>
        <CardTitle>Send a Message</CardTitle>
        <CardDescription>
          Have a question or a project in mind? Let&apos;s connect.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Full Name</Label>
            <Input id='name' name='name' placeholder='Your Name' required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email Address</Label>
            <Input id='email' name='email' type='email' placeholder='your.email@example.com' required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              name='message'
              placeholder='Your message...'
              rows={5}
              required
            />
          </div>
          <Button type='submit' className='w-full'>
            Send Message
          </Button>
          {status && <p className='mt-4 text-sm text-center text-muted-foreground'>{status}</p>}
        </form>
      </CardContent>
    </Card>
  )
} 