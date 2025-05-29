'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Home, User, Briefcase, MessageSquare, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/about', label: 'About', icon: User },
  { href: '/projects', label: 'Projects', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: MessageSquare },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname === href

  return (
    <header 
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-300',
        isScrolled 
          ? 'border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm' 
          : 'border-border/20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/40'
      )}
    >
      <div className='container flex h-16 max-w-screen-2xl items-center justify-between px-4'>
        {/* Logo */}
        <Link href='/' className='flex items-center space-x-3 group'>
          <div className='relative w-10 h-10 rounded-full overflow-hidden bg-white ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200'>
            <Image
              src='/images/logo.jpeg'
              alt='Eduard Kakosyan Logo'
              fill
              className='object-cover'
            />
          </div>
          <span className='font-bold text-lg tracking-tight hidden sm:inline-block group-hover:text-primary transition-colors'>
            Eduard Kakosyan
          </span>
          <span className='font-bold text-lg tracking-tight sm:hidden group-hover:text-primary transition-colors'>
            EK
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center'>
          <NavigationMenu>
            <NavigationMenuList className="flex justify-end">
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink 
                    asChild 
                    className={cn(
                      'inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-all duration-200',
                      isActive(link.href) && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    <Link href={link.href} className='flex items-center justify-center gap-2 w-full h-full'>
                      <link.icon className='h-4 w-4' />
                      <span className='leading-none'>{link.label}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Navigation */}
        <div className='md:hidden'>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className='h-10 w-10 hover:bg-accent/50 transition-all duration-200'
                aria-label="Toggle navigation menu"
              >
                <Menu className='h-5 w-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className='w-[300px] sm:w-[400px]'>
              <SheetHeader className='text-left pb-4'>
                <SheetTitle className='flex items-center gap-3'>
                  <div className='relative w-8 h-8 rounded-full overflow-hidden bg-white'>
                    <Image
                      src='/images/logo.jpeg'
                      alt='Eduard Kakosyan'
                      fill
                      className='object-cover'
                    />
                  </div>
                  Navigation
                </SheetTitle>
              </SheetHeader>
              
              <nav className='flex flex-col space-y-2 mt-4'>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent/50 active:scale-95',
                      isActive(link.href) 
                        ? 'bg-accent text-accent-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon className='h-5 w-5' />
                    {link.label}
                  </Link>
                ))}
                
                {/* Additional mobile-specific links */}
                <div className='pt-4 mt-4 border-t border-border'>
                  <p className='text-xs text-muted-foreground px-4 mb-2 uppercase tracking-wider font-medium'>
                    Quick Actions
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      // Scroll to AI assistant section
                      const aiSection = document.querySelector('[data-ai-assistant]')
                      if (aiSection) {
                        aiSection.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className='flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent/50 active:scale-95 text-muted-foreground hover:text-foreground w-full text-left'
                  >
                    <Sparkles className='h-5 w-5' />
                    Try AI Assistant
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
} 
