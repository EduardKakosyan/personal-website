import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { BlogPostData } from '@/lib/blog-utils' // Assuming BlogPostData type is exported from blog-utils
import Image from 'next/image'

type BlogPostItemProps = {
  post: BlogPostData
}

export function BlogPostItem({ post }: BlogPostItemProps) {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        {post.image && (
          <Link
            href={`/blog/${post.slug}`}
            className='mb-4 block aspect-video w-full overflow-hidden rounded-t-lg relative'>
            <Image
              src={post.image}
              alt={post.title}
              fill
              className='object-cover transition-transform duration-300 group-hover:scale-105'
            />
          </Link>
        )}
        <CardTitle className='text-xl lg:text-2xl'>
          <Link
            href={`/blog/${post.slug}`}
            className='hover:text-primary transition-colors'>
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className='text-sm'>
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {post.author && ` by ${post.author}`}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-grow'>
        {post.excerpt && <p className='line-clamp-3 text-muted-foreground'>{post.excerpt}</p>}
      </CardContent>
      <CardFooter className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          {post.tags?.map((tag) => (
            <Badge key={tag} variant='outline' className='text-xs'>
              {tag}
            </Badge>
          ))}
        </div>
        <Link href={`/blog/${post.slug}`} className='text-sm font-medium text-primary hover:underline'>
          Read More &rarr;
        </Link>
      </CardFooter>
    </Card>
  );
} 