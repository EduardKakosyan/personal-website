import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const postsDirectory = path.join(process.cwd(), 'src/content/blog')

export type BlogPostData = {
  slug: string
  title: string
  date: string
  excerpt?: string
  tags?: string[]
  author?: string
  image?: string
  contentHtml?: string // For fully rendered HTML content
  contentMarkdown?: string // For raw markdown content
  // Add any other frontmatter fields you expect
}

export function getSortedPostsData(): BlogPostData[] {
  // Get file names under /src/content/blog
  let fileNames: string[] = []
  try {
    fileNames = fs.readdirSync(postsDirectory)
  } catch (error) {
    // If the directory doesn't exist or is empty, return an empty array
    console.warn(`Could not read blog posts directory: ${postsDirectory}`, error)
    return []
  }

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md') || fileName.endsWith('.mdx')) // Filter for markdown files
    .map((fileName) => {
      // Remove ".md" or ".mdx" from file name to get slug
      const slug = fileName.replace(/\.(mdx|md)$/, '')

      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents)

      return {
        slug,
        ...(matterResult.data as Omit<BlogPostData, 'slug' | 'contentHtml' | 'contentMarkdown'>),
      }
    })

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export async function getPostData(slug: string): Promise<BlogPostData | null> {
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`)
  const mdPath = path.join(postsDirectory, `${slug}.md`)

  let fullPath = ''
  if (fs.existsSync(mdxPath)) {
    fullPath = mdxPath
  } else if (fs.existsSync(mdPath)) {
    fullPath = mdPath
  } else {
    return null // Post not found
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content)
  const contentHtml = processedContent.toString()

  return {
    slug,
    contentHtml,
    contentMarkdown: matterResult.content,
    ...(matterResult.data as Omit<BlogPostData, 'slug' | 'contentHtml' | 'contentMarkdown'>),
  }
}

export function getAllPostSlugs() {
  let fileNames: string[] = []
  try {
    fileNames = fs.readdirSync(postsDirectory)
  } catch {
    return []
  }
  
  return fileNames
    .filter((fileName) => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
    .map((fileName) => {
      return {
        params: {
          slug: fileName.replace(/\.(mdx|md)$/, ''),
        },
      };
    });
} 