'use client' // Or remove if no client-side interactivity initially

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className='py-12 md:py-24 lg:py-32 xl:py-48 w-full'>
      <div className='container px-4 md:px-6 mx-auto flex justify-center'>
        <div className='grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] max-w-6xl'>
          <div className='flex flex-col justify-center space-y-4'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                <span className='text-primary'>Eduard Kakosyan</span> BCS 
              </h1>
              <p className='max-w-[700px] text-muted-foreground md:text-lg/relaxed mt-4'>
                Based in Halifax, Nova Scotia, I work as an AI Developer at <Link href='https://www.ai-first.ca/' className='text-primary font-semibold hover:underline'>AI-First Consulting</Link>. 
                I focus on practical AI implementations, host local language models on my laptop, 
                and build applications that leverage AI capabilities effectively.
              </p>
            </div>
            <div className='flex flex-col gap-2 min-[400px]:flex-row'>
              <Button asChild size='lg'>
                <Link href='/projects'>View My Work</Link>
              </Button>
              <Button asChild variant='outline' size='lg'>
                <Link href='/contact'>Get in Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 