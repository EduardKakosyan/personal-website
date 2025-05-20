import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'
import rehypeHighlight from 'rehype-highlight'
import fs from 'fs'
import path from 'path'

export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await unified()
      .use(remarkParse) // Parse markdown content
      .use(remarkGfm) // Support GitHub Flavored Markdown
      .use(remarkRehype, { allowDangerousHtml: true }) // Convert to HTML AST
      .use(rehypeHighlight) // Add syntax highlighting
      .use(rehypeFormat) // Format HTML
      .use(rehypeStringify, { allowDangerousHtml: true }) // Stringify HTML
      .process(markdown)
    
    return result.toString()
  } catch (error) {
    console.error('Error processing markdown:', error)
    return `<div class="markdown-error"><p>${markdown}</p></div>`
  }
}

export function getMarkdownContent(filePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    return fileContents
  } catch (error) {
    console.error(`Error reading markdown file at ${filePath}:`, error)
    return '# Error loading content'
  }
} 