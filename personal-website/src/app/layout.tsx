import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { Chatbot } from "@/components/features/chatbot";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://eduardkakosyan.com'),
  title: {
    default: "Eduard Kakosyan | AI Developer",
    template: "%s | Eduard Kakosyan"
  },
  description: "AI Developer specializing in LLMs, local model deployment, and intelligent systems. Winner of Atlantic AI Summit 2025. Based in Halifax, Nova Scotia.",
  keywords: [
    "AI Developer", 
    "Machine Learning", 
    "LLM", 
    "OpenAI", 
    "Ollama", 
    "Halifax", 
    "Nova Scotia", 
    "Hackathon Winner",
    "HealthByte",
    "CarGrep",
    "Dalhousie University"
  ],
  authors: [{ name: "Eduard Kakosyan", url: "https://eduardkakosyan.com" }],
  creator: "Eduard Kakosyan",
  publisher: "Eduard Kakosyan",
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
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/favicon/favicon-32x32.png',
    shortcut: '/favicon.ico'
  },
  manifest: '/manifest.json',
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eduardkakosyan.com",
    title: "Eduard Kakosyan | AI Developer",
    description: "AI Developer specializing in LLMs, local model deployment, and intelligent systems. Winner of Atlantic AI Summit 2025.",
    siteName: "Eduard Kakosyan Portfolio",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Eduard Kakosyan - AI Developer"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Eduard Kakosyan | AI Developer",
    description: "AI Developer specializing in LLMs, local model deployment, and intelligent systems.",
    images: ["/images/og-image.jpg"],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: "https://eduardkakosyan.com",
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Eduard Kakosyan",
              "jobTitle": "AI Developer",
              "description": "AI Developer specializing in LLMs, local model deployment, and intelligent systems",
              "url": "https://eduardkakosyan.com",
              "sameAs": [
                "https://linkedin.com/in/eduardkakosyan",
                "https://github.com/eduardkakosyan"
              ],
              "worksFor": {
                "@type": "Organization",
                "name": "Freelance"
              },
              "alumniOf": {
                "@type": "Organization",
                "name": "Dalhousie University"
              },
              "knowsAbout": [
                "Artificial Intelligence",
                "Machine Learning",
                "Python",
                "Next.js",
                "OpenAI",
                "Ollama"
              ]
            })
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Skip to main content link for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Skip to main content
            </a>
            
            <div className="relative flex min-h-dvh flex-col bg-background">
              <Header />
              <main 
                id="main-content" 
                className="flex-1 flex flex-col items-center w-full"
                role="main"
              >
                {children}
              </main>
              <Footer />
              <Chatbot />
            </div>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
