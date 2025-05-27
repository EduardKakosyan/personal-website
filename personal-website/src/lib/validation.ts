import { z } from 'zod'

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.min(2, 'Name must be at least 2 characters')
		.max(100, 'Name must be less than 100 characters')
		.regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters'),
	
	email: z
		.string()
		.min(1, 'Email is required')
		.email('Please enter a valid email address')
		.max(254, 'Email is too long'),
	
	message: z
		.string()
		.min(1, 'Message is required')
		.min(10, 'Message must be at least 10 characters')
		.max(5000, 'Message must be less than 5000 characters')
})

export type ContactFormData = z.infer<typeof contactFormSchema>

/**
 * Chat message validation schema
 */
export const chatMessageSchema = z.object({
	content: z
		.string()
		.min(1, 'Message cannot be empty')
		.max(1000, 'Message is too long (max 1000 characters)')
		.refine(
			(content) => content.trim().length > 0,
			'Message cannot be only whitespace'
		)
})

export type ChatMessageData = z.infer<typeof chatMessageSchema>

/**
 * Blog post metadata validation schema
 */
export const blogPostMetaSchema = z.object({
	title: z.string().min(1).max(200),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	excerpt: z.string().optional(),
	author: z.string().optional(),
	tags: z.array(z.string()).optional(),
	image: z.string().url().optional(),
	slug: z.string().min(1)
})

export type BlogPostMeta = z.infer<typeof blogPostMetaSchema>

/**
 * Project metadata validation schema
 */
export const projectMetaSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().min(1).max(500),
	tags: z.array(z.string()),
	liveUrl: z.string().url().optional(),
	repoUrl: z.string().url().optional(),
	imageUrl: z.string().url().optional(),
	placement: z.string().optional(),
	slug: z.string().min(1),
	featured: z.boolean().optional()
})

export type ProjectMeta = z.infer<typeof projectMetaSchema>

/**
 * Rate limiting validation
 */
export const rateLimitSchema = z.object({
	identifier: z.string().min(1),
	action: z.enum(['contact', 'chat', 'general']),
	timestamp: z.number()
})

/**
 * Safe validation helper that returns both success status and data/errors
 */
export function safeValidate<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
	const result = schema.safeParse(data)
	
	if (result.success) {
		return { success: true, data: result.data }
	}
	
	const errors = result.error.errors.map(err => err.message)
	return { success: false, errors }
}

/**
 * Sanitizes and validates contact form data
 */
export function validateContactForm(data: unknown) {
	return safeValidate(contactFormSchema, data)
}

/**
 * Sanitizes and validates chat message data
 */
export function validateChatMessage(data: unknown) {
	return safeValidate(chatMessageSchema, data)
} 