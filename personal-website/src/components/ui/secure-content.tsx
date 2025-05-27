'use client'

import { sanitizeHtml } from '@/lib/sanitizer'
import { cn } from '@/lib/utils'

interface SecureContentProps {
	content: string
	className?: string
	allowedTags?: string[]
	allowedAttributes?: string[]
}

/**
 * Secure content wrapper that sanitizes HTML before rendering
 * Replaces dangerouslySetInnerHTML with a secure alternative
 */
export function SecureContent({ 
	content, 
	className,
	allowedTags,
	allowedAttributes 
}: SecureContentProps) {
	// Sanitize content with custom options if provided
	const sanitizedContent = sanitizeHtml(content, {
		...(allowedTags && { ALLOWED_TAGS: allowedTags }),
		...(allowedAttributes && { ALLOWED_ATTR: allowedAttributes })
	})

	return (
		<div 
			className={cn('secure-content', className)}
			dangerouslySetInnerHTML={{ __html: sanitizedContent }}
		/>
	)
}

/**
 * Markdown content wrapper with pre-configured security settings
 */
export function MarkdownContent({ content, className }: { content: string; className?: string }) {
	return (
		<SecureContent
			content={content}
			className={cn(
				'prose prose-zinc mx-auto max-w-3xl dark:prose-invert lg:prose-lg xl:prose-xl',
				'prose-headings:scroll-mt-20 prose-headings:font-bold',
				'prose-a:text-primary hover:prose-a:text-primary/80',
				'prose-strong:font-semibold',
				'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
				'prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:text-muted-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm',
				className
			)}
			allowedTags={[
				'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
				'p', 'br', 'div',
				'strong', 'b', 'em', 'i',
				'a', 'img',
				'ul', 'ol', 'li',
				'blockquote', 'pre', 'code',
				'table', 'thead', 'tbody', 'tr', 'th', 'td',
				'hr'
			]}
			allowedAttributes={[
				'href', 'src', 'alt', 'title',
				'class', 'id', 'target', 'rel'
			]}
		/>
	)
} 