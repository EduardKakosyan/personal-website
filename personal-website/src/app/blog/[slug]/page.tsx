import { getAllPostSlugs, getPostData } from '@/lib/blog-utils'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarkdownContent } from '@/components/ui/secure-content'
import { ErrorBoundary } from '@/components/ui/error-boundary'

type Props = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
  const paths = getAllPostSlugs()
  return paths
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params
  const post = await getPostData(resolvedParams.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || 'A blog post by AI Developer',
    authors: post.author ? [{ name: post.author }] : [],
    openGraph: {
      title: post.title,
      description: post.excerpt || 'A blog post by AI Developer',
      images: post.image ? [{ url: post.image, alt: post.title }] : [],
      type: 'article',
      publishedTime: new Date(post.date).toISOString(),
      authors: post.author ? [post.author] : [],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || 'A blog post by AI Developer',
      images: post.image ? [post.image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params
  const post = await getPostData(resolvedParams.slug)

  if (!post || !post.contentHtml) {
    notFound() // Triggers 404 page if post or content is missing
  }

  return (
    <ErrorBoundary>
      <article className='container py-12 md:py-16'>
        <div className='mb-8'>
          <Link
            href='/blog'
            className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors'
            aria-label="Back to blog posts">
            <ArrowLeftIcon className='mr-2 h-4 w-4' aria-hidden="true" />
            Back to Blog
          </Link>
        </div>
        
        <header className='mb-8 md:mb-12 text-center'>
          <h1 className='mb-3 text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl'>
            {post.title}
          </h1>
          <p className='text-muted-foreground'>
            <time dateTime={post.date}>
              Published on {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
              })}
            </time>
            {post.author && (
              <span>
                {' by '}
                <span className="font-medium">{post.author}</span>
              </span>
            )}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className='mt-4 flex flex-wrap justify-center gap-2' role="list">
              {post.tags.map((tag) => (
                <Badge key={tag} variant='secondary' role="listitem">
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
              width={1200}
              height={675}
              className='object-cover'
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
          </div>
        )}
        
        <MarkdownContent content={post.contentHtml} />
        
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "author": {
                "@type": "Person",
                "name": post.author || "Eduard Kakosyan"
              },
              "datePublished": post.date,
              "image": post.image,
              "publisher": {
                "@type": "Person",
                "name": "Eduard Kakosyan"
              }
            })
          }}
        />
      </article>
    </ErrorBoundary>
  );
} 