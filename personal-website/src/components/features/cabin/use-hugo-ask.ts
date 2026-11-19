'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HUGO_QUESTIONS } from './hugo-questions'
import type { HugoStop } from './hugo-stops'

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
 * HUGO's questions (A48), the overlay's side: which stop the guest is at (the
 * scene reports it), whether HUGO's card is open, Q to open and close it, and
 * the "Ask" prompt over him at each stop until the guest has asked there.
 * `blocked`: nothing opens it (the splitting game). `onOpen`: put away
 * whatever else is open (a reading panel, a box).
 */
export function useHugoAsk({ blocked, onOpen }: { blocked: boolean; onOpen: () => void }) {
  const [stop, setStop] = useState<HugoStop>('arrival')
  const [open, setOpen] = useState(false)
  /** Opened at least once: the card (and the model, if loaded) stays mounted from then on. */
  const [ever, setEver] = useState(false)
  const [askedAt, setAskedAt] = useState<HugoStop[]>([])
  const [talking, setTalking] = useState(false)
  const live = useRef({ stop, open, blocked, onOpen })
  useEffect(() => {
    live.current = { stop, open, blocked, onOpen }
  })

  const show = useCallback(() => {
    const l = live.current
    if (l.blocked || !HUGO_QUESTIONS[l.stop]) return
    l.onOpen()
    setOpen(true)
    setEver(true)
    setAskedAt((a) => (a.includes(l.stop) ? a : [...a, l.stop]))
  }, [])
  const close = useCallback(() => {
    setOpen(false)
    setTalking(false)
  }, [])
  const toggle = useCallback(() => (live.current.open ? close() : show()), [close, show])

  // Q asks HUGO (and puts his card away again), wherever he is.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyQ' || e.repeat || e.metaKey || e.ctrlKey || e.altKey || typing()) return
      e.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // The splitting game takes over the screen: the card goes away.
  useEffect(() => {
    if (!blocked || !live.current.open) return
    const id = window.setTimeout(close, 0)
    return () => window.clearTimeout(id)
  }, [blocked, close])

  return {
    stop,
    onStop: setStop,
    open,
    ever,
    show,
    close,
    toggle,
    /** The "Ask" prompt over HUGO: at a stop with questions where the guest hasn't asked yet. */
    unasked: Boolean(HUGO_QUESTIONS[stop]) && !askedAt.includes(stop),
    talking,
    setTalking,
  }
}
