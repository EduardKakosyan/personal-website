import 'server-only'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getProjectBySlug } from '@/content/projects'
import { markdownToHtml } from '@/lib/markdown'

export async function getProjectBody(slug: string): Promise<string> {
  if (!getProjectBySlug(slug)) throw new Error('Unknown project')
  const markdown = await readFile(
    join(process.cwd(), 'src/content/project-descriptions', `${slug}.md`),
    'utf8',
  )
  return markdownToHtml(markdown.replace(/^\s*# [^\n]*(?:\r?\n|$)/, ''))
}
