'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useGuide } from '@/components/providers/guide-provider'

const LazyGuidePanel = dynamic(() => import('./guide-panel').then((module) => module.GuidePanel), {
  ssr: false,
  loading: () => (
    <p className="site-guide-loading" role="status">
      Opening guide...
    </p>
  ),
})

export function GuideLauncher() {
  const { open, openGuide, closeGuide } = useGuide()
  const pathname = usePathname()
  return (
    <>
      {pathname !== '/' && (
        <button
          className="site-guide-launcher"
          aria-expanded={open}
          aria-controls={open ? 'guide-panel' : undefined}
          onClick={() => (open ? closeGuide() : openGuide())}
        >
          {open ? 'Close guide' : 'Ask EK—01'}
        </button>
      )}
      {open && <LazyGuidePanel />}
    </>
  )
}
