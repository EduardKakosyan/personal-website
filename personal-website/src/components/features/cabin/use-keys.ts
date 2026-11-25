'use client'

import { useEffect, useRef } from 'react'

/** Which movement keys are held, and whether the use key was just pressed. */
export type Keys = {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  /** Set when E, Enter or Space goes down; the frame loop clears it. */
  use: boolean
  /** Set when Escape goes down; the frame loop clears it. */
  escape: boolean
  /** Whether any movement key is held. */
  moving(): boolean
}

const MOVE: Record<string, keyof Pick<Keys, 'up' | 'down' | 'left' | 'right'>> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
}
const USE = new Set(['KeyE', 'Enter', 'Space'])

function typing() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (el as HTMLElement).isContentEditable
  )
}

/**
 * WASD and the arrow keys walk the guest; E, Enter or Space uses whatever the
 * prompt points at (Eduard: "add wasd and arrows for walking around").
 */
export function useKeys() {
  const keys = useRef<Keys>({
    up: false,
    down: false,
    left: false,
    right: false,
    use: false,
    escape: false,
    moving() {
      return this.up || this.down || this.left || this.right
    },
  })
  useEffect(() => {
    const k = keys.current
    const down = (e: KeyboardEvent) => {
      if (typing() || e.metaKey || e.ctrlKey || e.altKey) return
      const move = MOVE[e.code]
      if (move) {
        k[move] = true
        e.preventDefault()
      } else if (USE.has(e.code)) {
        // a focused button takes its own Enter/Space
        const el = document.activeElement
        if (el && el.tagName === 'BUTTON' && e.code !== 'KeyE') return
        if (!e.repeat) k.use = true
        e.preventDefault()
      } else if (e.code === 'Escape') {
        k.escape = true
      }
    }
    const up = (e: KeyboardEvent) => {
      const move = MOVE[e.code]
      if (move) k[move] = false
    }
    const blur = () => {
      k.up = k.down = k.left = k.right = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
  return keys
}
