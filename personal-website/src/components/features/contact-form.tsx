'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { validateContactForm } from '@/lib/validation'
import { sanitizeUserInput } from '@/lib/sanitizer'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

interface FormErrors {
	name?: string
	email?: string
	message?: string
}

export function ContactForm() {
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
	const [errors, setErrors] = useState<FormErrors>({})
	const [message, setMessage] = useState('')

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setStatus('loading')
		setErrors({})
		
		const formData = new FormData(event.currentTarget)
		const rawData = {
			name: formData.get('name') as string,
			email: formData.get('email') as string,
			message: formData.get('message') as string
		}

		// Validate form data
		const validation = validateContactForm(rawData)
		
		if (!validation.success) {
			const formErrors: FormErrors = {}
			validation.errors.forEach(error => {
				// Simple error mapping - in a real app you'd have more sophisticated error handling
				if (error.includes('Name')) formErrors.name = error
				if (error.includes('Email') || error.includes('email')) formErrors.email = error
				if (error.includes('Message')) formErrors.message = error
			})
			setErrors(formErrors)
			setStatus('error')
			setMessage('Please fix the errors above and try again.')
			return
		}

		// Sanitize inputs
		const sanitizedData = {
			name: sanitizeUserInput(validation.data.name),
			email: sanitizeUserInput(validation.data.email),
			message: sanitizeUserInput(validation.data.message)
		}

		try {
			// Create mailto link with sanitized data
			const subject = encodeURIComponent(`Contact Form Submission from ${sanitizedData.name}`)
			const body = encodeURIComponent(
				`Name: ${sanitizedData.name}\nEmail: ${sanitizedData.email}\n\nMessage:\n${sanitizedData.message}`
			)
			
			// Simulate processing delay for better UX
			await new Promise(resolve => setTimeout(resolve, 1000))
			
			// Open email client
			window.location.href = `mailto:eduard@ai-first.ca?subject=${subject}&body=${body}`
			
			setStatus('success')
			setMessage('Your message has been prepared and your email client should open. Please send the email to complete your message.')
			
			// Reset form after success
			setTimeout(() => {
				event.currentTarget.reset()
				setStatus('idle')
				setMessage('')
			}, 5000)
			
		} catch (error) {
			console.error('Contact form error:', error)
			setStatus('error')
			setMessage('Sorry, there was an error preparing your message. Please try again or contact me directly.')
		}
	}

	return (
		<Card className='w-full max-w-lg mx-auto'>
			<CardHeader>
				<CardTitle>Send a Message</CardTitle>
				<CardDescription>
					Have a question or a project in mind? Let's connect.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-6' noValidate>
					<div className='space-y-2'>
						<Label htmlFor='name'>
							Full Name <span className="text-destructive" aria-label="required">*</span>
						</Label>
						<Input 
							id='name' 
							name='name' 
							type='text'
							placeholder='Your Name' 
							required 
							aria-invalid={!!errors.name}
							aria-describedby={errors.name ? 'name-error' : undefined}
							disabled={status === 'loading'}
						/>
						{errors.name && (
							<p id="name-error" className="text-sm text-destructive flex items-center gap-1">
								<AlertCircle className="h-4 w-4" />
								{errors.name}
							</p>
						)}
					</div>
					
					<div className='space-y-2'>
						<Label htmlFor='email'>
							Email Address <span className="text-destructive" aria-label="required">*</span>
						</Label>
						<Input 
							id='email' 
							name='email' 
							type='email' 
							placeholder='your.email@example.com' 
							required 
							aria-invalid={!!errors.email}
							aria-describedby={errors.email ? 'email-error' : undefined}
							disabled={status === 'loading'}
						/>
						{errors.email && (
							<p id="email-error" className="text-sm text-destructive flex items-center gap-1">
								<AlertCircle className="h-4 w-4" />
								{errors.email}
							</p>
						)}
					</div>
					
					<div className='space-y-2'>
						<Label htmlFor='message'>
							Message <span className="text-destructive" aria-label="required">*</span>
						</Label>
						<Textarea
							id='message'
							name='message'
							placeholder='Your message...'
							rows={5}
							required
							aria-invalid={!!errors.message}
							aria-describedby={errors.message ? 'message-error' : undefined}
							disabled={status === 'loading'}
						/>
						{errors.message && (
							<p id="message-error" className="text-sm text-destructive flex items-center gap-1">
								<AlertCircle className="h-4 w-4" />
								{errors.message}
							</p>
						)}
					</div>
					
					<Button 
						type='submit' 
						className='w-full' 
						disabled={status === 'loading'}
						aria-describedby={message ? 'form-message' : undefined}
					>
						{status === 'loading' ? (
							<LoadingSpinner size="sm" className="mr-2" />
						) : (
							<Send className="h-4 w-4 mr-2" />
						)}
						{status === 'loading' ? 'Preparing...' : 'Send Message'}
					</Button>
					
					{message && (
						<div 
							id="form-message"
							className={`mt-4 p-3 rounded-md flex items-start gap-2 text-sm ${
								status === 'success' 
									? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
									: status === 'error'
									? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
									: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
							}`}
							role={status === 'error' ? 'alert' : 'status'}
							aria-live="polite"
						>
							{status === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
							{status === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
							<span>{message}</span>
						</div>
					)}
				</form>
				
				{/* Alternative contact methods */}
				<div className="mt-6 pt-6 border-t">
					<p className="text-sm text-muted-foreground mb-2">Or reach out directly:</p>
					<div className="space-y-1 text-sm">
						<p>
							<strong>Email:</strong>{' '}
							<a 
								href="mailto:eduard@ai-first.ca" 
								className="text-primary hover:underline"
								target="_blank"
								rel="noopener noreferrer"
							>
								eduard@ai-first.ca
							</a>
						</p>
						<p>
							<strong>LinkedIn:</strong>{' '}
							<a 
								href="https://linkedin.com/in/eduardkakosyan" 
								className="text-primary hover:underline"
								target="_blank"
								rel="noopener noreferrer"
							>
								eduardkakosyan
							</a>
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
} 