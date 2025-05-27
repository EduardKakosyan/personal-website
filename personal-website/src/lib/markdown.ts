import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'
import rehypeHighlight from 'rehype-highlight'
import fs from 'fs'
import path from 'path'
import { sanitizeMarkdownHtml } from './sanitizer'

export async function markdownToHtml(markdown: string): Promise<string> {
	try {
		const result = await unified()
			.use(remarkParse) // Parse markdown content
			.use(remarkGfm) // Support GitHub Flavored Markdown
			.use(remarkRehype, { 
				allowDangerousHtml: false // Security: disable dangerous HTML
			}) 
			.use(rehypeHighlight) // Add syntax highlighting
			.use(rehypeFormat) // Format HTML
			.use(rehypeStringify, { 
				allowDangerousHtml: false // Security: disable dangerous HTML
			})
			.process(markdown)
		
		// Sanitize the resulting HTML for security
		const htmlString = result.toString()
		const sanitizedHtml = sanitizeMarkdownHtml(htmlString)
		
		return sanitizedHtml
	} catch (error) {
		console.error('Error processing markdown:', error)
		// Return sanitized fallback content
		return sanitizeMarkdownHtml(`<div class="markdown-error"><p>Error loading content</p></div>`)
	}
}

export function getMarkdownContent(filePath: string): string {
	try {
		const fullPath = path.join(process.cwd(), filePath)
		
		// Security: Validate file path to prevent directory traversal
		const normalizedPath = path.normalize(fullPath)
		const projectRoot = process.cwd()
		
		if (!normalizedPath.startsWith(projectRoot)) {
			throw new Error('Invalid file path: outside project directory')
		}
		
		// Security: Only allow reading from specific directories
		const allowedDirectories = [
			path.join(projectRoot, 'src/content'),
			path.join(projectRoot, 'content')
		]
		
		const isPathAllowed = allowedDirectories.some(allowedDir => 
			normalizedPath.startsWith(allowedDir)
		)
		
		if (!isPathAllowed) {
			throw new Error('Invalid file path: not in allowed directories')
		}
		
		const fileContents = fs.readFileSync(normalizedPath, 'utf8')
		return fileContents
	} catch (error) {
		console.error(`Error reading markdown file at ${filePath}:`, error)
		return '# Error loading content\n\nThe requested content could not be loaded.'
	}
}

/**
 * Safely processes markdown with comprehensive error handling
 */
export async function safeMarkdownToHtml(markdown: string): Promise<string> {
	if (!markdown || typeof markdown !== 'string') {
		return ''
	}
	
	// Truncate extremely long content to prevent DoS
	if (markdown.length > 1000000) { // 1MB limit
		console.warn('Markdown content truncated due to size limit')
		markdown = markdown.substring(0, 1000000) + '\n\n*[Content truncated due to size limit]*'
	}
	
	return markdownToHtml(markdown)
}

/**
 * Extract frontmatter and content from markdown
 */
export function parseMarkdownWithFrontmatter(content: string): {
	frontmatter: Record<string, unknown>
	content: string
} {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
	const match = content.match(frontmatterRegex)
	
	if (!match) {
		return {
			frontmatter: {},
			content: content
		}
	}
	
	try {
		// Simple YAML-like parsing for basic frontmatter
		const frontmatterText = match[1]
		const frontmatter: Record<string, unknown> = {}
		
		frontmatterText.split('\n').forEach(line => {
			const colonIndex = line.indexOf(':')
			if (colonIndex > 0) {
				const key = line.substring(0, colonIndex).trim()
				let value: unknown = line.substring(colonIndex + 1).trim()
				
				// Remove quotes if present
				if (typeof value === 'string' && 
					((value.startsWith('"') && value.endsWith('"')) || 
					(value.startsWith("'") && value.endsWith("'")))) {
					value = value.slice(1, -1)
				}
				
				// Parse arrays (simple comma-separated values)
				if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
					value = value.slice(1, -1).split(',').map((item: string) => item.trim())
				}
				
				frontmatter[key] = value
			}
		})
		
		return {
			frontmatter,
			content: match[2]
		}
	} catch (error) {
		console.error('Error parsing frontmatter:', error)
		return {
			frontmatter: {},
			content: content
		}
	}
} 