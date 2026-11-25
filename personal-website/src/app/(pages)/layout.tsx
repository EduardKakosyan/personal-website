import { Header } from '@/components/layouts/header'
import { Footer } from '@/components/layouts/footer'
import { PageTransitionProvider } from '@/components/providers/page-transition-provider'

/**
 * The plain pages (Work, each project, About, Contact): the corner bar, the page's sheets of
 * paper over the sky, and a paper strip at the foot. The look is in site.css.
 */
export default function PagesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="site-shell">
      <a href="#main-content" className="site-skip">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex w-full flex-1 flex-col items-center">
        <PageTransitionProvider>{children}</PageTransitionProvider>
      </main>
      <Footer />
    </div>
  )
}
