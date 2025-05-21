export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='border-t border-border/40 py-6 md:py-8 w-full'>
      <div className='container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row px-4 md:px-6 max-w-6xl mx-auto'>
        <p className='text-balance text-center text-sm leading-loose text-muted-foreground md:text-left'>
          &copy; {currentYear} Eduard Kakosyan. All rights reserved.
        </p>
        <div className='flex items-center gap-4'>
          {/* Placeholder for social media icons/links */}
          <a
            href='https://github.com/eduardkakosyan'
            target='_blank'
            rel='noreferrer'
            className='font-medium underline underline-offset-4'
          >
            GitHub
          </a>
          <a
            href='https://linkedin.com/in/eduard-kakosyan'
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