import type { Metadata } from 'next'
import { Pixelify_Sans } from 'next/font/google'
import { ArrivalPreview } from '@/components/features/cabin/arrival-preview'

// Step 4 of the redesign: one small scene to test the look and feel.
// Not linked from anywhere and not indexed.

const pixel = Pixelify_Sans({
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Arrival (preview)',
  robots: { index: false, follow: false },
}

export default function ArrivalPreviewPage() {
  return (
    <div className={pixel.variable}>
      <ArrivalPreview />
    </div>
  )
}
