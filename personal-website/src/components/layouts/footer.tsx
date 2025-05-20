export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='border-t border-border/40 py-6 md:py-8'>
      <div className='container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row'>
        <p className='text-balance text-center text-sm leading-loose text-muted-foreground md:text-left'>
          &copy; {currentYear} AI Developer. All rights reserved.
        </p>
        <div className='flex items-center gap-4'>
          {/* Placeholder for social media icons/links */}
          <a
            href='https://github.com'
            target='_blank'
            rel='noreferrer'
            className='font-medium underline underline-offset-4'
          >
            GitHub
          </a>
          <a
            href='https://linkedin.com'
            target='_blank'
            rel='noreferrer'
            className='font-medium underline underline-offset-4'
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  )
} 