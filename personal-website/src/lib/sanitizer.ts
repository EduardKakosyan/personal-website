import DOMPurify from 'isomorphic-dompurify'

/**
 * Secure HTML sanitization configuration
 */
const SANITIZE_CONFIG = {
	ALLOWED_TAGS: [
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'p', 'br', 'div', 'span',
		'strong', 'b', 'em', 'i', 'u', 's',
		'a', 'img',
		'ul', 'ol', 'li',
		'blockquote', 'pre', 'code',
		'table', 'thead', 'tbody', 'tr', 'th', 'td',
		'hr'
	],
	ALLOWED_ATTR: [
		'href', 'target', 'rel',
		'src', 'alt', 'width', 'height',
		'class', 'id',
		'title', 'aria-label', 'aria-describedby',
		'role'
	],
	ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
	ALLOW_DATA_ATTR: false,
	FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
	FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
	KEEP_CONTENT: true,
	RETURN_DOM: false,
	RETURN_DOM_FRAGMENT: false,
	RETURN_TRUSTED_TYPE: false
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The HTML content to sanitize
 * @param options - Additional sanitization options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string, options?: Partial<typeof SANITIZE_CONFIG>): string {
	if (!dirty || typeof dirty !== 'string') {
		return ''
	}

	const config = { ...SANITIZE_CONFIG, ...options }
	
	try {
		const clean = DOMPurify.sanitize(dirty, config)
		return typeof clean === 'string' ? clean : ''
	} catch (error) {
		console.error('HTML sanitization error:', error)
		// Return empty string on error for security
		return ''
	}
}

/**
 * Sanitizes markdown content for blog posts with stricter rules
 * @param dirty - The HTML content from markdown
 * @returns Sanitized HTML string
 */
export function sanitizeMarkdownHtml(dirty: string): string {
	return sanitizeHtml(dirty, {
		ALLOWED_TAGS: [
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'p', 'br', 'div',
			'strong', 'b', 'em', 'i',
			'a', 'img',
			'ul', 'ol', 'li',
			'blockquote', 'pre', 'code',
			'table', 'thead', 'tbody', 'tr', 'th', 'td',
			'hr'
		],
		ALLOWED_ATTR: [
			'href', 'src', 'alt', 'title',
			'class', 'id'
		],
		// More restrictive for user-generated content
		ALLOW_DATA_ATTR: false
	})
}

/**
 * Sanitizes user input for forms and chat
 * @param input - User input string
 * @returns Sanitized string (strips all HTML)
 */
export function sanitizeUserInput(input: string): string {
	if (!input || typeof input !== 'string') {
		return ''
	}

	// Strip all HTML for user inputs
	return DOMPurify.sanitize(input, {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
		KEEP_CONTENT: true
	})
}

/**
 * Hook to make all links open in new window and add security attributes
 */
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
	// Add security attributes to all links
	if ('target' in node) {
		node.setAttribute('target', '_blank')
		node.setAttribute('rel', 'noopener noreferrer')
	}
	if (node.hasAttribute('href') && !node.hasAttribute('target')) {
		node.setAttribute('target', '_blank')
		node.setAttribute('rel', 'noopener noreferrer')
	}
}) 