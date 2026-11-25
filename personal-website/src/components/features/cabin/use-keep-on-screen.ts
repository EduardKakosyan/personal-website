'use client'

import { useEffect, type RefObject } from 'react'

const EDGE = 8
/** Clear of the title and the corner bar along the top. */
const TOP = 46

/**
 * Bubbles and cards follow things in the 3D scene; nudge them sideways so they
 * never run off the screen. Sets `--shift` on the element (its CSS adds it to
 * the transform and moves the pointer tail back the other way). A tall one
 * (HUGO answering a question, when he's near the top of the screen) is also
 * let down so its top stays in view: `--drop`.
 */
export function useKeepOnScreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let shift = 0
    let drop = 0
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
        const top = rect.top - drop
        const nextDrop = top < TOP ? TOP - top : 0
        if (Math.abs(nextDrop - drop) > 0.5) {
          drop = nextDrop
          el.style.setProperty('--drop', `${Math.round(drop)}px`)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [ref])
}
