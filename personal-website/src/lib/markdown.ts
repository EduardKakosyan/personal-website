import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'
import rehypeHighlight from 'rehype-highlight'
import fs from 'fs'
import path from 'path'
import { sanitizeHtml } from './sanitizer'

interface HtmlNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HtmlNode[]
}

// Stable heading IDs let guide commands point at the actual Markdown section.
function headingAnchors() {
  return (tree: HtmlNode) => {
    const used = new Map<string, number>()
    const text = (node: HtmlNode): string => node.value ?? node.children?.map(text).join('') ?? ''
    const visit = (node: HtmlNode) => {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName ?? '')) {
        const base =
          text(node)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-') || 'section'
        const count = used.get(base) ?? 0
        used.set(base, count + 1)
        node.properties = { ...node.properties, id: count ? `${base}-${count}` : base }
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await unified()
      .use(remarkParse) // Parse markdown content
      .use(remarkGfm) // Support GitHub Flavored Markdown
      .use(remarkRehype, {
        allowDangerousHtml: false, // Security: disable dangerous HTML
      })
      .use(headingAnchors)
      .use(rehypeHighlight) // Add syntax highlighting
      .use(rehypeFormat) // Format HTML
      .use(rehypeStringify, {
        allowDangerousHtml: false, // Security: disable dangerous HTML
      })
      .process(markdown)

    // Sanitize the resulting HTML for security
    const htmlString = result.toString()
    const sanitizedHtml = sanitizeHtml(htmlString)

    return sanitizedHtml
  } catch (error) {
    console.error('Error processing markdown:', error)
    // Return sanitized fallback content
    return sanitizeHtml(`<div class="markdown-error"><p>Error loading content</p></div>`)
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
      path.join(projectRoot, 'content'),
    ]

    const isPathAllowed = allowedDirectories.some((allowedDir) =>
      normalizedPath.startsWith(allowedDir),
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
