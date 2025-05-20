import { BlogPostItem } from '@/components/features/blog-post-item'
import { getSortedPostsData } from '@/lib/blog-utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | AI Developer',
  description: 'Read articles and insights on AI, machine learning, web development, and more.',
}

export default function BlogPage() {
  const posts = getSortedPostsData()

  return (
    <div className='container py-12 md:py-16'>
      <div className='mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl'>
          The AI Developer Blog
        </h1>
        <p className='mt-3 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl'>
          Thoughts, tutorials, and explorations in the world of Artificial Intelligence and Software Engineering.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {posts.map((post) => (
            <BlogPostItem key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className='text-center text-muted-foreground'>
          No blog posts yet. Stay tuned!
        </p>
      )}
    </div>
  )
} 