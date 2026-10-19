import { z } from 'zod'

/**
 * Chat message validation schema
 */
export const chatMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long (max 1000 characters)')
    .refine((content) => content.trim().length > 0, 'Message cannot be only whitespace'),
})

export type ChatMessageData = z.infer<typeof chatMessageSchema>

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
  featured: z.boolean().optional(),
})

export type ProjectMeta = z.infer<typeof projectMetaSchema>

/**
 * Safe validation helper that returns both success status and data/errors
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors.map((err) => err.message)
  return { success: false, errors }
}

/**
 * Sanitizes and validates chat message data
 */
export function validateChatMessage(data: unknown) {
  return safeValidate(chatMessageSchema, data)
}
