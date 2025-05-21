import { getAllPostSlugs, getPostData } from '@/lib/blog-utils'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  params: {
    slug: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateStaticParams() {
  const paths = getAllPostSlugs()
  return paths
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const post = await getPostData(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || 'A blog post by AI Developer',
    authors: post.author ? [{ name: post.author }] : [],
    // openGraph: {
    //   title: post.title,
    //   description: post.excerpt,
    //   images: post.image ? [post.image] : [],
    //   type: 'article',
    //   publishedTime: new Date(post.date).toISOString(),
    //   authors: post.author ? [post.author] : [],
    //   tags: post.tags,
    // },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostData(params.slug)

  if (!post || !post.contentHtml) {
    notFound() // Triggers 404 page if post or content is missing
  }

  return (
    <article className='container py-12 md:py-16'>
      <div className='mb-8'>
        <Link
          href='/blog'
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
          legacyBehavior>
          <ArrowLeftIcon className='mr-2 h-4 w-4' />
          Back to Blog
        </Link>
      </div>
      <header className='mb-8 md:mb-12 text-center'>
        <h1 className='mb-3 text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl'>
          {post.title}
        </h1>
        <p className='text-muted-foreground'>
          Published on {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
          {post.author && ` by ${post.author}`}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className='mt-4 flex flex-wrap justify-center gap-2'>
            {post.tags.map((tag) => (
              <Badge key={tag} variant='secondary'>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>
      {post.image && (
        <div className='mb-8 aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-lg md:mb-12'>
          <Image
            src={post.image}
            alt={post.title}
            width={1200} // Provide appropriate width
            height={675}  // Provide appropriate height (16:9 aspect ratio)
            className='object-cover'
            priority
          />
        </div>
      )}
      <div
        className={cn(
          'prose prose-zinc mx-auto max-w-3xl dark:prose-invert lg:prose-lg xl:prose-xl',
          'prose-headings:scroll-mt-20 prose-headings:font-bold',
          'prose-a:text-primary hover:prose-a:text-primary/80',
          'prose-strong:font-semibold',
          'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
          'prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:text-muted-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm'
        )}
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
      {/* Optional: Add discussion/comments section here */}
    </article>
  );
} 