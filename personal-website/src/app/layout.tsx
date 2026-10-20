import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import './site.css'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layouts/header'
import { Footer } from '@/components/layouts/footer'
import { GuideLauncher } from '@/components/features/guide/guide-launcher'
import { GuideProvider } from '@/components/providers/guide-provider'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { PageTransitionProvider } from '@/components/providers/page-transition-provider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { WebVitals } from '@/components/features/web-vitals'
import { identity, profile } from '@/content/profile'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

// Person structured data, built from the same facts as the résumé and the footer.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: identity.name,
  jobTitle: identity.title,
  description: profile.headline,
  url: identity.website,
  email: `mailto:${identity.email}`,
  homeLocation: { '@type': 'Place', name: `${identity.location}, ${identity.country}` },
  sameAs: [identity.linkedin, identity.github],
  worksFor: { '@type': 'Organization', name: identity.company, url: identity.companyUrl },
  alumniOf: profile.education.map((entry) => ({
    '@type': 'CollegeOrUniversity',
    name: entry.school,
  })),
  knowsAbout: profile.skills.flatMap((group) => group.items),
}

const siteTitle = 'Eduard Kakosyan | Forward Deployed AI Developer'
const siteDescription =
  'Eduard Kakosyan is a Forward Deployed AI Developer based in Halifax. He leads tech and AI at AI-First Solutions and builds local AI systems and coding-agent loops.'

export const metadata: Metadata = {
  metadataBase: new URL(identity.website),
  title: {
    default: siteTitle,
    template: '%s | Eduard Kakosyan',
  },
  description: siteDescription,
  keywords: [
    'AI Developer',
    'Forward Deployed Engineering',
    'Applied AI',
    'Machine Learning',
    'LLM',
    'OpenAI',
    'Ollama',
    'Halifax',
    'Nova Scotia',
    'HealthByte',
    'CarGrep',
    'Dalhousie University',
    'AI Education',
    'Agentic AI',
    'Shiftkey Labs',
  ],
  authors: [{ name: identity.name, url: identity.website }],
  creator: identity.name,
  publisher: identity.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=ek', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/favicon/favicon-32x32.png?v=ek', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/favicon.ico?v=ek',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: identity.website,
    title: siteTitle,
    description: siteDescription,
    siteName: 'Eduard Kakosyan Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: identity.website,
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ErrorBoundary>
          <WebVitals />
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>

          <GuideProvider>
            <div className="site-shell relative flex min-h-dvh flex-col">
              <Header />
              <main
                id="main-content"
                className="flex-1 flex flex-col items-center w-full"
                role="main"
              >
                <PageTransitionProvider>{children}</PageTransitionProvider>
              </main>
              <Footer />
              <GuideLauncher />
            </div>
          </GuideProvider>
        </ErrorBoundary>
        {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true' && <Analytics />}
        <SpeedInsights />
      </body>
    </html>
  )
}
