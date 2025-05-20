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
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 max-w-screen-2xl items-center justify-between'>
        <Link href='/' className='flex items-center space-x-2'>
          {/* <Icons.logo className="h-6 w-6" /> Need to define an Icon component or use text */}
          <span className='font-bold sm:inline-block'>AI Dev</span>
        </Link>
        <NavigationMenu className='hidden md:flex'>
          <NavigationMenuList>
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <Link href={link.href} asChild>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), 'text-sm')}>
                    {link.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className='flex flex-1 items-center justify-end space-x-2'>
          {/* Placeholder for Theme Toggle or other actions */}
          {/* <ModeToggle /> */}
        </div>
        {/* Mobile Menu Trigger - to be implemented */}
        {/* <button className="md:hidden">Menu</button> */}
      </div>
    </header>
  );
} 