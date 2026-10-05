'use client'

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { agentLayout } from '@/lib/agent-layout'
import { useGuide } from '@/components/providers/guide-provider'

const AgentVisual = dynamic(() => import('./agent-scene').then((module) => module.AgentVisual), {
  ssr: false,
})

export function FlyingAgent({ children }: { children?: ReactNode }) {
  const { open, mood, target, openGuide } = useGuide()
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()
  const [heroVisible, setHeroVisible] = useState(pathname === '/')
  const [attentive, setAttentive] = useState(false)
  const bubble = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
    bubbleX: 0,
    bubbleY: 0,
    docked: false,
    pointing: false,
    direction: -1 as -1 | 1,
    visible: false,
    viewportHeight: 900,
    compact: false,
  })
  useEffect(() => {
    let frame = 0
    const measure = () => {
      const vw = window.innerWidth
      const vh = window.visualViewport?.height ?? window.innerHeight
      const landing = document.getElementById('agent-landing-pad')?.getBoundingClientRect() ?? null
      const hero = document.querySelector('.studio-hero')?.getBoundingClientRect()
      setHeroVisible(pathname === '/' && !!hero && hero.bottom > 160)
      const targetRect = target?.isConnected ? target.getBoundingClientRect() : null
      setPosition({
        ...agentLayout({
          width: vw,
          height: vh,
          open,
          target: targetRect,
          landing,
          bubbleHeight: bubble.current?.offsetHeight || Math.min(330, vh - 240),
        }),
        visible: true,
        viewportHeight: vh,
        compact: vh < 520,
      })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(document.documentElement)
    if (bubble.current) observer.observe(bubble.current)
    if (target?.isConnected) observer.observe(target)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
    }
  }, [open, target, pathname])
  if (heroVisible && !open) return null
  return (
    <motion.div
      className="flying-agent"
      data-open={open}
      data-docked={position.docked}
      data-pointing={position.pointing}
      data-bubble-above={position.bubbleY < 0}
      data-mood={mood}
      data-compact={position.compact}
      style={{ '--agent-viewport-height': `${position.viewportHeight}px` } as CSSProperties}
      initial={false}
      animate={{ x: position.x, y: position.y, opacity: position.visible ? 1 : 0 }}
      transition={
        reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 75, damping: 19, mass: 1.1 }
      }
    >
      {open && (
        <div
          ref={bubble}
          className="agent-speech-bubble"
          style={{ left: position.bubbleX, top: position.bubbleY }}
          data-lenis-prevent
        >
          {children}
        </div>
      )}
      <button
        className="flying-agent-character"
        onClick={() => openGuide()}
        onPointerEnter={() => setAttentive(true)}
        onPointerLeave={() => setAttentive(false)}
        onFocus={() => setAttentive(true)}
        onBlur={() => setAttentive(false)}
        aria-label={open ? 'Portfolio agent is speaking' : 'Talk to the 3D portfolio agent'}
        aria-expanded={open}
      >
        <span className="agent-flight-shadow" />
        <span className="agent-visual">
          <AgentVisual
            mood={mood}
            pointing={position.pointing}
            direction={position.direction}
            attentive={attentive}
          />
        </span>
      </button>
      {!open && (
        <button className="agent-invitation" onClick={() => openGuide()}>
          {position.docked ? 'Ask me about the work' : 'Ask EK—01'} <span>↗</span>
        </button>
      )}
      {position.pointing && !open && <span className="agent-point-label">Here’s the work.</span>}
    </motion.div>
  )
}
