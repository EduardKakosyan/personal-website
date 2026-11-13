'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CornerBar } from './corner-bar'
import styles from './cabin.module.css'
import type { Bubble, Face } from './arrival-scene'
import { HUGO_CABIN_LINE, TODO_DRAFT, type CabinResume } from './cabin-content'
import { ResumePanel, TodoPanel } from './cabin-panels'
import { LOOK_ROWS, parseLook, type Look, type ReadableId } from './world'

// three.js loads only on this page, after hydration.
const ArrivalScene = dynamic(() => import('./arrival-scene'), { ssr: false })

// HUGO's opening lines are Eduard's wording (A77); the others are still placeholders.
const LINES = {
  hugoHello:
    "Hi! You must be Eduard's guest. I'm HUGO, his personal assistant. Welcome to his happy place. Feel free to look around, and when you're ready, he's waiting for us by the cabin.",
  hugoRusty: "Oh, and there's Rusty! Give him a pet, he deserves it.",
  eduardWelcome: "Hey! HUGO, show them around, I'll finish up here.",
  hugoReply: "You heard him! Let's start with the cabin.",
}

/**
 * Render resolution. Pixel looks draw about LOOK_ROWS rows, each world pixel a
 * whole number of screen pixels so they stay square and crisp. The smooth look
 * draws at full resolution (Lo-Fi: a bit under).
 */
function useDpr(look: Look, lofi: boolean) {
  const [dpr, setDpr] = useState(0.25)
  useEffect(() => {
    const update = () => {
      if (look === 'smooth') {
        setDpr(lofi ? 0.6 : Math.min(window.devicePixelRatio || 1, 2))
        return
      }
      const rows = LOOK_ROWS[look][lofi ? 'lofi' : 'normal']
      const pixelSize = Math.max(1, Math.round(window.innerHeight / rows))
      setDpr(1 / pixelSize)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [look, lofi])
  return dpr
}

export function ArrivalPreview({ resume }: { resume: CabinResume }) {
  const [lofi, setLofi] = useState(false)
  const [sound, setSound] = useState(false)
  const [ready, setReady] = useState(false)
  const [moved, setMoved] = useState(false)
  const [bubble, setBubble] = useState<Bubble>(null)
  const [greeting, setGreeting] = useState(false)
  const [panel, setPanel] = useState<ReadableId | null>(null)
  const closePanel = useCallback(() => setPanel(null), [])
  const [startNearCabin] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('skip'),
  )
  // ?face=mustache shows the other option for Eduard's face (A54).
  const [face] = useState<Face>(() =>
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('face') === 'mustache'
      ? 'mustache'
      : 'beard',
  )
  // ?look=pixel|soft|smooth: the three looks to compare (see world.ts).
  const [look] = useState<Look>(() =>
    parseLook(
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('look')
        : null,
    ),
  )
  const dpr = useDpr(look, lofi)
  const timers = useRef<number[]>([])
  const welcomed = useRef(false)
  const [isWelcomed, setIsWelcomed] = useState(false)

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  // Pick Lo-Fi automatically on low-power devices.
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    if (cores <= 4 || memory <= 4) {
      const id = window.setTimeout(() => setLofi(true), 0)
      return () => window.clearTimeout(id)
    }
  }, [])

  // Rusty first (A76): the site opens with Rusty running down the driveway
  // with the cow and Eduard waving from the deck; HUGO says hello once Rusty's
  // there. (?skip=1 starts by the cabin, where Rusty waits at his spot.)
  // The opening (A77): HUGO introduces himself; once the guest has had time to
  // read it, Rusty comes running down the driveway with the cow and HUGO points
  // him out. (?skip=1 starts by the cabin, where Rusty waits at his spot.)
  const [rustyGo, setRustyGo] = useState(false)
  const onReady = useCallback(() => {
    setReady(true)
    later(700, () => {
      if (!welcomed.current) setBubble({ speaker: 'HUGO', text: LINES.hugoHello })
    })
    // typing time (38 letters a second) plus a moment to finish reading
    const readTime = (LINES.hugoHello.length / 38) * 1000 + 2500
    if (!startNearCabin) later(700 + readTime, () => setRustyGo(true))
  }, [later, startNearCabin])

  const onRustyComing = useCallback(() => {
    if (welcomed.current) return
    setBubble({ speaker: 'HUGO', text: LINES.hugoRusty })
    later(8000, () => setBubble((b) => (b?.text === LINES.hugoRusty ? null : b)))
  }, [later])

  // Eduard welcomes the guest once they're near the deck and Rusty has given them the cow.
  const welcomeState = useRef({ near: false, cow: false, done: false })
  const welcome = useCallback(() => {
    const w = welcomeState.current
    if (w.done || !w.near || !w.cow) return
    w.done = true
    setGreeting(true)
    setBubble({ speaker: 'Eduard', text: LINES.eduardWelcome })
    later(4300, () => setBubble({ speaker: 'HUGO', text: LINES.hugoReply }))
    later(5200, () => setGreeting(false))
    later(8600, () => setBubble((b) => (b?.text === LINES.hugoReply ? null : b)))
  }, [later])

  // (Walking doesn't clear HUGO's line: the guest may still be reading it.)
  const onFirstMove = useCallback(() => setMoved(true), [])

  const onGuestNear = useCallback(() => {
    welcomed.current = true
    setIsWelcomed(true)
    setBubble((b) => (b?.text === LINES.hugoHello ? null : b))
    welcomeState.current.near = true
    welcome()
  }, [welcome])

  const onCowDropped = useCallback(() => {
    welcomeState.current.cow = true
    welcome()
  }, [welcome])

  const onEnterCabin = useCallback(() => {
    setBubble({ speaker: 'HUGO', text: HUGO_CABIN_LINE })
    later(6500, () => setBubble((b) => (b?.text === HUGO_CABIN_LINE ? null : b)))
  }, [later])

  return (
    <div className={styles.stage}>
      <ArrivalScene
        dpr={dpr}
        look={look}
        lofi={lofi}
        face={face}
        bubble={bubble}
        eduardGreeting={greeting}
        startNearCabin={startNearCabin}
        rustyGo={rustyGo}
        onRustyComing={onRustyComing}
        onReady={onReady}
        onFirstMove={onFirstMove}
        onGuestNear={onGuestNear}
        onCowDropped={onCowDropped}
        onEnterCabin={onEnterCabin}
        onRead={setPanel}
      />
      {panel === 'resume' && <ResumePanel resume={resume} onClose={closePanel} />}
      {panel === 'todo' && <TodoPanel items={TODO_DRAFT} onClose={closePanel} />}
      <p className={`${styles.title} ${styles.pixel}`}>Eduard Kakosyan</p>
      <CornerBar
        sound={sound}
        lofi={lofi}
        onToggleSound={() => setSound((v) => !v)}
        onToggleLofi={() => setLofi((v) => !v)}
      />
      {!ready && (
        <div className={`${styles.loading} ${styles.pixel}`}>Heading up the gravel road…</div>
      )}
      {ready && !moved && !isWelcomed && (
        <p className={`${styles.hint} ${styles.pixel}`}>Tap the ground to walk</p>
      )}
    </div>
  )
}
