import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className='py-12 md:py-24 w-full'>
      <div className='container mx-auto px-4 max-w-4xl'>
        <Card className='border-0 shadow-lg bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5'>
          <CardContent className='p-8 md:p-12 text-center'>
            <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl mb-4'>
              Let&apos;s Connect
            </h2>
            <p className='text-muted-foreground md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed'>
              Whether you need AI integration for your business, consultation on AI projects, 
              or want to collaborate and build something cool, I&apos;m available to chat! 
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button asChild size='lg' className='min-w-[160px]'>
                <Link href='/contact'>Get in Touch</Link>
              </Button>
              <Button asChild variant='outline' size='lg' className='min-w-[160px]'>
                <Link href='/projects'>View My Work</Link>
              </Button>
            </div>
            <div className='mt-8 pt-6 border-t border-muted'>
              <p className='text-sm text-muted-foreground'>
                Based in Halifax, Nova Scotia | Available for remote collaboration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
} 