'use client'
import { useEffect, useState, type RefObject } from 'react'

export interface StageEnvironment {
  stickyLayout: boolean // matches the desktop sticky-stage layout in site.css
  reducedMotion: boolean
  saveData: boolean
  deviceMemory?: number // GB; undefined where the browser does not report it
  webgl2: boolean
}

// Pure decision, so it can be tested without a browser.
export function stageCapable(env: StageEnvironment) {
  return (
    env.stickyLayout &&
    !env.reducedMotion &&
    !env.saveData &&
    (env.deviceMemory ?? 4) >= 4 &&
    env.webgl2
  )
}

function readEnvironment(): StageEnvironment {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean }
    deviceMemory?: number
  }
  const probe = () => {
    const context = document.createElement('canvas').getContext('webgl2')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!context
  }
  const env = {
    stickyLayout: matchMedia('(min-width: 768px) and (min-height: 701px)').matches,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: nav.deviceMemory,
    webgl2: false,
  }
  // Only create a GL context when every cheaper check already passes.
  return { ...env, webgl2: stageCapable({ ...env, webgl2: true }) && probe() }
}

// True once the page has loaded, a quarter of the stage is on screen, the browser is idle,
// and the device can afford the 3D stage. Until then (and forever on phones), stills show.
export function useIdleCapability(target: RefObject<Element | null>) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    let cancelIdle: (() => void) | undefined
    let observer: IntersectionObserver | undefined
    const whenIdle = () => {
      const run = () => {
        if (!cancelled && stageCapable(readEnvironment())) setReady(true)
      }
      if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(run, { timeout: 2000 })
        cancelIdle = () => window.cancelIdleCallback(id)
      } else {
        const id = globalThis.setTimeout(run, 200)
        cancelIdle = () => globalThis.clearTimeout(id)
      }
    }
    const whenNear = () => {
      if (!target.current || !('IntersectionObserver' in window)) return
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          observer?.disconnect()
          whenIdle()
        },
        { threshold: 0.25 },
      )
      observer.observe(target.current)
    }
    if (document.readyState === 'complete') whenNear()
    else window.addEventListener('load', whenNear, { once: true })
    return () => {
      cancelled = true
      observer?.disconnect()
      window.removeEventListener('load', whenNear)
      cancelIdle?.()
    }
  }, [target])
  return ready
}
