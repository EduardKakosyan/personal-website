'use client'

import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 max-w-screen-2xl items-center justify-between'>
        <div className='flex items-center'>
          <Link href='/' className='flex items-center space-x-2 pl-4'>
            <span className='font-bold sm:inline-block'>Eduard Kakosyan</span>
          </Link>
        </div>
        <div className='flex items-center justify-end'>
          <NavigationMenu>
            <NavigationMenuList className="flex justify-end">
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), 'text-sm')}>
                    <Link href={link.href}>
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className='flex items-center ml-4'>
          </div>
        </div>
      </div>
    </header>
  );
} 
