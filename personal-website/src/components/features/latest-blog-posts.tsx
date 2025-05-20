import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Sample data - replace with actual data fetching later
const latestPosts = [
  {
    slug: 'first-post',
    title: 'The Future of AI in Web Development',
    date: '2024-07-28',
    excerpt: 'Exploring how artificial intelligence is reshaping the landscape of web development, from automated coding to personalized user experiences...',
  },
  {
    slug: 'optimizing-llms',
    title: 'Practical Tips for Optimizing Large Language Models',
    date: '2024-07-15',
    excerpt: 'A dive into techniques for making LLMs more efficient and effective for real-world applications without sacrificing performance...',
  },
]

export function LatestBlogPosts() {
  return (
    <section className='py-12 md:py-24 bg-muted/40'>
      <div className='container'>
        <h2 className='mb-8 text-center text-3xl font-bold tracking-tighter sm:text-4xl'>
          From the Blog
        </h2>
        <div className='flex justify-center'>
          <div className='grid gap-6 md:grid-cols-2 lg:gap-8'>
            {latestPosts.map((post) => (
              <Card key={post.slug}>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription className='text-sm text-muted-foreground'>
                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='mb-4 line-clamp-3 text-sm leading-relaxed'>{post.excerpt}</p>
                  <Button asChild variant='outline'>
                    <Link href={`/blog/${post.slug}`}>Read More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className='mt-12 text-center'>
          <Button asChild size='lg'>
            <Link href='/blog'>Visit Blog</Link>
          </Button>
        </div>
      </div>
    </section>
  )
} 