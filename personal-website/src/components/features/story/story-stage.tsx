'use client'
import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { type ChapterId } from '@/content/story'
import { useGuide } from '@/components/providers/guide-provider'
import { useIdleCapability } from '@/lib/use-idle-capability'
import { StageStill } from '@/components/features/story/stage-still'

// The only route to three.js: a client-only chunk requested after the capability gate passes.
const StoryCanvas = dynamic(() => import('./story-canvas').then((module) => module.StoryCanvas), {
  ssr: false,
})

export function StoryStage({ current, order }: { current: ChapterId; order: ChapterId[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const capable = useIdleCapability(ref)
  const { mood } = useGuide()
  const [state, setState] = useState<'still' | 'live' | 'lost'>('still')
  const onReady = useCallback(() => setState((now) => (now === 'lost' ? now : 'live')), [])
  const onLost = useCallback(() => setState('lost'), [])
  return (
    <div ref={ref} className="story-visual" data-live={state === 'live'}>
      {/* The still stays in layout (no shift) and in the accessibility tree under the canvas. */}
      <StageStill current={current} />
      {capable && state !== 'lost' && (
        <StoryCanvas order={order} mood={mood} onReady={onReady} onLost={onLost} />
      )}
    </div>
  )
}
