'use client' // Or remove if no client-side interactivity initially

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className='relative py-16 md:py-24 lg:py-32 w-full overflow-hidden'>
      {/* Background gradient */}
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5' />
      
      <div className='relative container px-4 md:px-6 mx-auto flex justify-center'>
        <div className='max-w-4xl mx-auto text-center space-y-8'>
          {/* Hero content */}
          <div className={cn(
            'space-y-6 transition-all duration-1000 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}>
            {/* Main heading */}
            <div className='space-y-4'>
              <h1 className='text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight'>
                <span className='block'>
                  <span className='text-primary'>Eduard Kakosyan</span>
                </span>
                <span className='block text-2xl md:text-3xl lg:text-4xl font-medium text-muted-foreground mt-2'>
                  AI Enthusiast & Developer
                </span>
              </h1>
            </div>
            
            {/* Description */}
            <p className='max-w-2xl mx-auto text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed px-4'>
              I work as an AI Developer at{' '}
              <Link 
                href='https://www.ai-first.ca/' 
                className='text-primary font-semibold hover:underline transition-colors'
                target='_blank'
                rel='noopener noreferrer'
              >
                AI-First Consulting
              </Link>
              , focusing on practical AI implementations. I have 2+ years of experience in automation and AI.
              On my free time, I host local models, build random projects, and listen to MLST.
            </p>
          </div>
          
          {/* Action buttons */}
          <div className={cn(
            'flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 ease-out delay-300',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}>
            <Button 
              asChild 
              size='lg' 
              className='w-full sm:w-auto haptic-medium group'
            >
              <Link href='/projects' className='flex items-center gap-2'>
                View My Work
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </Link>
            </Button>
            <Button 
              asChild 
              variant='outline' 
              size='lg'
              className='w-full sm:w-auto haptic-light'
            >
              <Link href='/contact'>Get in Touch</Link>
            </Button>
          </div>
          {/* Scroll indicator for mobile */}
          <div className='md:hidden pt-8'>
            <div className='flex flex-col items-center gap-2 text-muted-foreground'>
              <span className='text-xs'>Scroll to explore</span>
              <div className='w-px h-8 bg-gradient-to-b from-muted-foreground/50 to-transparent' />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 