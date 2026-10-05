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
  allowedAttributes,
}: SecureContentProps) {
  // Sanitize content with custom options if provided
  const sanitizedContent = sanitizeHtml(content, {
    ...(allowedTags && { ALLOWED_TAGS: allowedTags }),
    ...(allowedAttributes && { ALLOWED_ATTR: allowedAttributes }),
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
      className={cn('prose markdown-content', className)}
      allowedTags={[
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'div',
        'span',
        'strong',
        'b',
        'em',
        'i',
        'a',
        'img',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'hr',
      ]}
      allowedAttributes={['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel']}
    />
  )
}
