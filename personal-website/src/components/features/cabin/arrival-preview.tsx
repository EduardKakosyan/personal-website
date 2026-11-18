'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CornerBar } from './corner-bar'
import styles from './cabin.module.css'
import type { Bubble, Face, SceneApi } from './arrival-scene'
import type { Greeting } from './eduard'
import {
  EDUARD_HANDOVER_LINE,
  EDUARD_HELLO_LINE,
  HUGO_CABIN_LINE,
  HUGO_LEAD_LINE,
  HUGO_LOOK_LINES,
  HUGO_SPLIT_DONE_LINE,
  HUGO_WOODSHED_LINE,
  TODO_DRAFT,
  type BenchProject,
  type CabinResume,
} from './cabin-content'
import { ResumePanel, TodoPanel } from './cabin-panels'
import { BoxCard, WorkbenchIndex } from './box-card'
import { ChecklistCard, GoalToast } from './checklist-card'
import { ControlsCard } from './controls-card'
import { SplitHud, type SplitHudHandle } from './split-hud'
import {
  GOALS,
  countDone,
  isDone,
  loadProgress,
  saveProgress,
  type GoalId,
  type Progress,
} from './checklist'
import { LOOK_ROWS, parseLook, type Guest, type Look, type PanelId } from './world'

// three.js loads only on this page, after hydration.
const ArrivalScene = dynamic(() => import('./arrival-scene'), { ssr: false })

// HUGO's opening lines are Eduard's wording (A77); the others are still placeholders.
const LINES = {
  hugoHello:
    "Hi! You must be Eduard's guest. I'm HUGO, his personal assistant. Welcome to his happy place. Feel free to look around, and when you're ready, he's waiting for us by the cabin.",
  hugoRusty: "Oh, and there's Rusty! Give him a pet, he deserves it.",
  eduardHello: EDUARD_HELLO_LINE,
  eduardHandover: EDUARD_HANDOVER_LINE,
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

/** A setting remembered in the browser. */
function useStored<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial)
  useEffect(() => {
    // (after hydration, so the first render matches the server's)
    const id = window.setTimeout(() => {
      try {
        const v = window.localStorage.getItem(key)
        if (v !== null) setValue(v as T)
      } catch {
        // nothing remembered
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [key])
  const set = useCallback(
    (v: T) => {
      setValue(v)
      try {
        window.localStorage.setItem(key, v)
      } catch {
        // private mode
      }
    },
    [key],
  )
  return [value, set]
}

export function ArrivalPreview({
  resume,
  projects,
}: {
  resume: CabinResume
  projects: BenchProject[]
}) {
  const [lofi, setLofi] = useState(false)
  const [sound, setSound] = useState(false)
  const [ready, setReady] = useState(false)
  const [moved, setMoved] = useState(false)
  const [bubble, setBubble] = useState<Bubble>(null)
  const [greeting, setGreeting] = useState<Greeting>(false)
  const [panel, setPanel] = useState<PanelId | null>(null)
  const [wantBox, setWantBox] = useState<number | null>(null)
  const [splitting, setSplitting] = useState(false)
  const [guest, setGuest] = useStored<Guest>('cabin.guest', 'one')
  const [controlsHidden, setControlsHidden] = useStored<'yes' | 'no'>('cabin.controls-hidden', 'no')
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [progress, setProgress] = useState<Progress>({})
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const toastKey = useRef(0)
  const api = useRef<SceneApi | null>(null)
  const splitHud = useRef<SplitHudHandle | null>(null)
  const [touch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches,
  )
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

  // The checklist, remembered between visits.
  useEffect(() => {
    const id = window.setTimeout(() => setProgress(loadProgress()), 0)
    return () => window.clearTimeout(id)
  }, [])
  const onGoal = useCallback((id: GoalId, part?: string) => {
    setProgress((p) => {
      const goal = GOALS.find((g) => g.id === id)
      if (!goal || isDone(p, goal)) return p
      let next: Progress
      if (goal.parts) {
        const had = Array.isArray(p[id]) ? (p[id] as string[]) : []
        if (part === undefined || had.includes(part)) return p
        next = { ...p, [id]: [...had, part] }
      } else next = { ...p, [id]: true }
      saveProgress(next)
      if (isDone(next, goal)) {
        toastKey.current += 1
        setToast({ text: goal.label, key: toastKey.current })
      }
      return next
    })
  }, [])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(id)
  }, [toast])

  const onRead = useCallback((id: PanelId) => {
    setWantBox(null)
    setPanel(id)
  }, [])
  const onOpenBox = useCallback((index: number) => {
    setPanel(null)
    setWantBox(index)
  }, [])
  const onCloseBox = useCallback(() => setWantBox(null), [])
  const onBoxOpened = useCallback(
    (index: number) => {
      const p = projects[index]
      if (p) onGoal('boxes', p.slug)
    },
    [onGoal, projects],
  )

  // Pick Lo-Fi automatically on low-power devices.
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    if (cores <= 4 || memory <= 4) {
      const id = window.setTimeout(() => setLofi(true), 0)
      return () => window.clearTimeout(id)
    }
  }, [])

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

  // Eduard welcomes the guest once they're near the deck and Rusty has given
  // them the cow: first to the guest (he stands and waves), then he hands them
  // over to HUGO.
  const welcomeState = useRef({ near: false, cow: false, done: false })
  const welcome = useCallback(() => {
    const w = welcomeState.current
    if (w.done || !w.near || !w.cow) return
    w.done = true
    setGreeting('guest')
    setBubble({ speaker: 'Eduard', text: LINES.eduardHello })
    later(3800, () => {
      setGreeting('hugo')
      setBubble({ speaker: 'Eduard', text: LINES.eduardHandover })
    })
    later(7600, () => setBubble({ speaker: 'HUGO', text: LINES.hugoReply }))
    later(8400, () => setGreeting(false))
    later(11800, () => setBubble((b) => (b?.text === LINES.hugoReply ? null : b)))
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

  // When the guest walks out of the cabin, HUGO leads them to the woodshed
  // (Eduard). If a reading panel is open then, he waits until it's closed.
  const [hugoLead, setHugoLead] = useState(false)
  const lead = useRef({ started: false, waiting: false })
  const reachedWoodshed = useRef(false)
  const panelOpen = useRef(false)
  useEffect(() => {
    panelOpen.current = panel !== null
  }, [panel])
  const startLead = useCallback(() => {
    if (lead.current.started || reachedWoodshed.current) return
    if (panelOpen.current) {
      lead.current.waiting = true
      return
    }
    lead.current.started = true
    setHugoLead(true)
    setBubble({ speaker: 'HUGO', text: HUGO_LEAD_LINE })
    later(6000, () => setBubble((b) => (b?.text === HUGO_LEAD_LINE ? null : b)))
  }, [later])
  const closePanel = useCallback(() => {
    setPanel(null)
    panelOpen.current = false
    if (lead.current.waiting) {
      lead.current.waiting = false
      startLead()
    }
  }, [startLead])

  const onEnterCabin = useCallback(() => {
    setBubble({ speaker: 'HUGO', text: HUGO_CABIN_LINE })
    later(6500, () => setBubble((b) => (b?.text === HUGO_CABIN_LINE ? null : b)))
  }, [later])

  // As soon as the guest walks back out of the cabin, HUGO takes them on a
  // little walk to the woodshed (Eduard; it used to start ten seconds after
  // they walked in, while they were still looking round).
  const onLeaveCabin = useCallback(() => startLead(), [startLead])

  const onReachWoodshed = useCallback(() => {
    reachedWoodshed.current = true
    setBubble({ speaker: 'HUGO', text: HUGO_WOODSHED_LINE })
    later(7000, () => setBubble((b) => (b?.text === HUGO_WOODSHED_LINE ? null : b)))
  }, [later])

  // HUGO says a line about each easter egg the guest looks at.
  const onLook = useCallback(
    (id: 'basket' | 'rod' | 'tackle') => {
      const text = HUGO_LOOK_LINES[id]
      setBubble({ speaker: 'HUGO', text })
      later(6500, () => setBubble((b) => (b?.text === text ? null : b)))
    },
    [later],
  )

  // The splitting game: the HUD while it's on, and HUGO's line at the end.
  const onSplit = useCallback((active: boolean) => setSplitting(active), [])
  const onSplitFrame = useCallback(
    (s: {
      marker: number
      ready: boolean
      count: number
      event: null | 'crack' | 'perfect' | 'thunk' | 'done'
    }) => {
      splitHud.current?.set(s)
      if (s.event === 'done') {
        setBubble({ speaker: 'HUGO', text: HUGO_SPLIT_DONE_LINE })
        later(6000, () => setBubble((b) => (b?.text === HUGO_SPLIT_DONE_LINE ? null : b)))
      }
    },
    [later],
  )

  const found = { done: countDone(progress), all: GOALS.length }
  const controlsOpen = controlsHidden !== 'yes'

  return (
    <div className={styles.stage}>
      <ArrivalScene
        dpr={dpr}
        look={look}
        lofi={lofi}
        face={face}
        guest={guest}
        bubble={bubble}
        eduardGreeting={greeting}
        startNearCabin={startNearCabin}
        found={progress}
        wantBox={wantBox}
        api={api}
        rustyGo={rustyGo}
        hugoLead={hugoLead}
        onRustyComing={onRustyComing}
        onReady={onReady}
        onFirstMove={onFirstMove}
        onGuestNear={onGuestNear}
        onCowDropped={onCowDropped}
        onEnterCabin={onEnterCabin}
        onLeaveCabin={onLeaveCabin}
        onReachWoodshed={onReachWoodshed}
        onRead={onRead}
        onLook={onLook}
        boxTags={projects.map((p) => ({ slug: p.slug, tag: p.tag }))}
        onOpenBox={onOpenBox}
        onCloseBox={onCloseBox}
        onBoxOpened={onBoxOpened}
        onGoal={onGoal}
        onSplit={onSplit}
        onSplitFrame={onSplitFrame}
      />
      {panel === 'resume' && <ResumePanel resume={resume} onClose={closePanel} />}
      {panel === 'todo' && <TodoPanel items={TODO_DRAFT} onClose={closePanel} />}
      {panel === 'workbench' && (
        <WorkbenchIndex projects={projects} onPick={onOpenBox} onClose={closePanel} />
      )}
      {wantBox !== null && (
        <BoxCard projects={projects} index={wantBox} onPick={onOpenBox} onClose={onCloseBox} />
      )}
      {splitting && (
        <SplitHud
          touch={touch}
          handleRef={splitHud}
          onSwing={() => api.current?.swing()}
          onDone={() => api.current?.stopSplit()}
        />
      )}
      {checklistOpen && (
        <ChecklistCard progress={progress} onClose={() => setChecklistOpen(false)} />
      )}
      {toast && <GoalToast key={toast.key} text={toast.text} />}
      <p className={`${styles.title} ${styles.pixel}`}>Eduard Kakosyan</p>
      <CornerBar
        sound={sound}
        lofi={lofi}
        onToggleSound={() => setSound((v) => !v)}
        onToggleLofi={() => setLofi((v) => !v)}
        found={found}
        checklistOpen={checklistOpen}
        onToggleChecklist={() => setChecklistOpen((v) => !v)}
        controlsOpen={controlsOpen}
        onToggleControls={() => setControlsHidden(controlsOpen ? 'yes' : 'no')}
      />
      {ready && controlsOpen && !splitting && wantBox === null && (
        <ControlsCard
          touch={touch}
          guest={guest}
          onPickGuest={setGuest}
          onHide={() => setControlsHidden('yes')}
        />
      )}
      {!ready && (
        <div className={`${styles.loading} ${styles.pixel}`}>Heading up the gravel road…</div>
      )}
      {ready && !moved && !isWelcomed && !controlsOpen && (
        <p className={`${styles.hint} ${styles.pixel}`}>
          {touch ? 'Tap the ground to walk' : 'WASD to walk, or click the ground'}
        </p>
      )}
    </div>
  )
}
