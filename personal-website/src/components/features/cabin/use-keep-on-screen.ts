'use client'

import { useEffect, type RefObject } from 'react'

const EDGE = 8

/**
 * Bubbles and cards follow things in the 3D scene; nudge them sideways so they
 * never run off the screen. Sets `--shift` on the element (its CSS adds it to
 * the transform and moves the pointer tail back the other way).
 */
export function useKeepOnScreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let shift = 0
    let frame = 0
    const tick = () => {
      const el = ref.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const left = rect.left - shift
        const right = rect.right - shift
        let next = 0
        if (left < EDGE) next = EDGE - left
        else if (right > window.innerWidth - EDGE) next = window.innerWidth - EDGE - right
        if (Math.abs(next - shift) > 0.5) {
          shift = next
          el.style.setProperty('--shift', `${Math.round(shift)}px`)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [ref])
}
