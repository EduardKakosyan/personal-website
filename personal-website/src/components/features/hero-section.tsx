'use client' // Or remove if no client-side interactivity initially

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className='py-12 md:py-24 lg:py-32 xl:py-48'>
      <div className='container px-4 md:px-6'>
        <div className='grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]'>
          {/* Optional: Placeholder for an image or AI-themed visual */}
          {/* <img src="/placeholder.svg" alt="Hero" className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square" /> */}
          <div className='flex flex-col justify-center space-y-4'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                Innovate with Intelligent Solutions
              </h1>
              <p className='max-w-[600px] text-muted-foreground md:text-xl'>
                Hi, I&apos;m an AI Developer based in Halifax, Nova Scotia, specializing in building cutting-edge AI applications and driving technological advancements.
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