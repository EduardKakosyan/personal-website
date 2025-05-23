import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";
import { Chatbot } from "@/components/features/chatbot";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Eduard Kakosyan | AI Developer",
  description: "AI Developer specializing in LLMs, local model deployment, and intelligent systems. Winner of Atlantic AI Summit 2025. Based in Halifax, Nova Scotia.",
  keywords: ["AI Developer", "Machine Learning", "LLM", "OpenAI", "Ollama", "Halifax", "Nova Scotia", "Hackathon Winner"],
  authors: [{ name: "Eduard Kakosyan" }],
  creator: "Eduard Kakosyan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eduardkakosyan.com",
    title: "Eduard Kakosyan | AI Developer",
    description: "AI Developer specializing in LLMs, local model deployment, and intelligent systems. Winner of Atlantic AI Summit 2025.",
    siteName: "Eduard Kakosyan Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eduard Kakosyan | AI Developer",
    description: "AI Developer specializing in LLMs, local model deployment, and intelligent systems.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-dvh flex-col bg-background">
            <Header />
            <main className="flex-1 flex flex-col items-center w-full">{children}</main>
            <Footer />
            <Chatbot />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
