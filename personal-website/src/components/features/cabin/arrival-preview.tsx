'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CornerBar } from './corner-bar'
import { PlainNote, SceneBoundary, hasWebGL } from './cabin-fallback'
import styles from './cabin.module.css'
import type { Bubble, Face, FireSpeech, SceneApi } from './arrival-scene'
import type { Greeting } from './eduard'
import {
  EDUARD_HANDOVER_LINE,
  EDUARD_HELLO_LINE,
  HUGO_CABIN_LINE,
  HUGO_CATCH_UP_CABIN,
  HUGO_LEAD_LINE,
  HUGO_LOOK_LINES,
  HUGO_RESUME_LINE,
  HUGO_SPLIT_DONE_LINE,
  HUGO_WOODSHED_LINE,
  HUGO_WORKBENCH_LINE,
  TODO_LIST,
  projectSlug,
  type BenchProject,
  type CabinResume,
} from './cabin-content'
import { ProjectNote, ResumePanel, TodoPanel } from './cabin-panels'
import { BoxCard, WorkbenchIndex } from './box-card'
import { ChecklistCard, GoalToast } from './checklist-card'
import { ControlsCard } from './controls-card'
import { SplitHud, type SplitHudHandle } from './split-hud'
import { FishingHud, type FishingHudHandle, type FishingHudState } from './fishing-hud'
import { HUGO_BROOK_LEAD_LINE } from './brook'
import { HUGO_FIRE_LEAD_LINE } from './fire'
import { EDUARD_FIRE_LINES, HUGO_GOODBYE_LINE, HUGO_YAHTZEE_LINE } from './fire-questions'
import { FireTalk } from './fire-talk'
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
import { useHugoAsk } from './use-hugo-ask'
import {
  CHECKPOINT_NAMES,
  clearCheckpoint,
  loadCheckpoint,
  reach,
  reached,
  saveCheckpoint,
  withAsked,
  type Checkpoint,
} from './checkpoint'
import type { BubbleLink } from './speech-bubble'

// three.js loads only on this page, after hydration (and only if the browser has WebGL).
const ArrivalScene = dynamic(() => import('./arrival-scene'), { ssr: false })
// HUGO's card and the ask box (A48): loaded the first time the guest asks him.
const HugoAsk = dynamic(() => import('./hugo-ask').then((m) => m.HugoAsk), { ssr: false })
type HugoSaying = import('./hugo-ask').HugoSaying

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
  notes,
}: {
  resume: CabinResume
  /** The boxes on the workbench. */
  projects: BenchProject[]
  /** Every project, for the note a link to its page opens (ProjectNote). */
  notes: BenchProject[]
}) {
  const [lofi, setLofi] = useState(false)
  const [ready, setReady] = useState(false)
  /** Whether the cabin can be drawn here (null until checked, after hydration), and whether the scene has failed. */
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [sceneFailed, setSceneFailed] = useState(false)
  const [moved, setMoved] = useState(false)
  const [bubble, setBubble] = useState<Bubble>(null)
  const [greeting, setGreeting] = useState<Greeting>(false)
  const [panel, setPanel] = useState<PanelId | null>(null)
  /** A note about a project, opened from a link under something said (ProjectNote). */
  const [note, setNote] = useState<BenchProject | null>(null)
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
  const [fishing, setFishing] = useState(false)
  const fishingHud = useRef<FishingHudHandle | null>(null)
  const [touch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches,
  )
  const [startNearCabin] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('skip'),
  )
  // ?night=1 starts by the fire at night (scene 7), without the walk round first.
  const [startAtNight] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('night'),
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
  // The visit's last checkpoint (checkpoint.ts): after a reload, a crash, or
  // coming back from another page, the guest starts there. (?skip and ?night
  // are shortcuts for looking at a scene: they neither pick a visit up nor
  // save one.)
  const shortcut = startNearCabin || startAtNight
  const [resumed] = useState<Checkpoint | null>(() =>
    typeof window === 'undefined' || shortcut ? null : loadCheckpoint(),
  )
  const checkpoint = useRef<Checkpoint | null>(resumed)
  const hit = useCallback(
    (next: (cp: Checkpoint | null) => Checkpoint) => {
      if (shortcut) return
      checkpoint.current = next(checkpoint.current)
      saveCheckpoint(checkpoint.current)
    },
    [shortcut],
  )
  /** Starting by the fire, at night: ?night=1, or back at the fire's checkpoint. */
  const atNight = startAtNight || resumed?.at === 'fire'
  const timers = useRef<number[]>([])
  const welcomed = useRef(atNight || resumed !== null)
  const [isWelcomed, setIsWelcomed] = useState(atNight || resumed !== null)
  /** "Back at the woodshed, where you left off.", for a few seconds. */
  const [resumeNote, setResumeNote] = useState(resumed !== null)

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

  const closeAsk = useRef(() => {})
  /** What HUGO has floated over to point out, and whether the guest has picked the résumé up yet. */
  const [pointsAt, setPointsAt] = useState<'bench' | 'resume' | null>(null)
  const resumeRead = useRef(false)
  /** The guest's at the workbench: HUGO needn't point it out (any more). */
  const seenBench = useRef(() => {})
  const onRead = useCallback((id: PanelId) => {
    closeAsk.current()
    setWantBox(null)
    setNote(null)
    setPanel(id)
    if (id === 'workbench') seenBench.current()
    if (id === 'resume') {
      resumeRead.current = true
      setPointsAt((p) => (p === 'resume' ? null : p))
      setBubble((b) => (b?.text === HUGO_RESUME_LINE ? null : b))
    }
  }, [])
  const onOpenBox = useCallback((index: number) => {
    closeAsk.current()
    setPanel(null)
    setNote(null)
    setWantBox(index)
    seenBench.current()
  }, [])
  const onCloseBox = useCallback(() => setWantBox(null), [])
  const onBoxOpened = useCallback(
    (index: number) => {
      const p = projects[index]
      if (p) onGoal('boxes', p.slug)
    },
    [onGoal, projects],
  )

  // No WebGL, no cabin: the plain note instead (PlainNote).
  useEffect(() => {
    const id = window.setTimeout(() => setWebgl(hasWebGL()), 0)
    return () => window.clearTimeout(id)
  }, [])
  const onSceneError = useCallback(() => setSceneFailed(true), [])

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
    if (atNight) return
    if (resumed) {
      // Back where they left off. At the woodshed and the brook, getting
      // there again says where they are; at the cabin, HUGO starts them off.
      if (resumed.at === 'cabin')
        later(700, () => {
          setBubble({ speaker: 'HUGO', text: HUGO_CATCH_UP_CABIN })
          later(6000, () => setBubble((b) => (b?.text === HUGO_CATCH_UP_CABIN ? null : b)))
        })
      return
    }
    later(700, () => {
      if (!welcomed.current) setBubble({ speaker: 'HUGO', text: LINES.hugoHello })
    })
    // typing time (38 letters a second) plus a moment to finish reading
    const readTime = (LINES.hugoHello.length / 38) * 1000 + 2500
    if (!startNearCabin) later(700 + readTime, () => setRustyGo(true))
  }, [later, startNearCabin, atNight, resumed])

  const onRustyComing = useCallback(() => {
    if (welcomed.current) return
    setBubble({ speaker: 'HUGO', text: LINES.hugoRusty })
    later(8000, () => setBubble((b) => (b?.text === LINES.hugoRusty ? null : b)))
  }, [later])

  // Eduard welcomes the guest once they're near the deck and Rusty has given
  // them the cow: first to the guest (he stands and waves), then he hands them
  // over to HUGO.
  const welcomeState = useRef({ near: false, cow: false, done: resumed !== null })
  const welcome = useCallback(() => {
    const w = welcomeState.current
    if (w.done || !w.near || !w.cow) return
    w.done = true
    hit((cp) => reach(cp, 'cabin'))
    setGreeting('guest')
    setBubble({ speaker: 'Eduard', text: LINES.eduardHello })
    later(3800, () => {
      setGreeting('hugo')
      setBubble({ speaker: 'Eduard', text: LINES.eduardHandover })
    })
    later(7600, () => setBubble({ speaker: 'HUGO', text: LINES.hugoReply }))
    later(8400, () => setGreeting(false))
    later(11800, () => setBubble((b) => (b?.text === LINES.hugoReply ? null : b)))
  }, [later, hit])

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
  const lead = useRef({ started: reached(resumed, 'woodshed'), waiting: false })
  const reachedWoodshed = useRef(reached(resumed, 'brook'))
  const panelOpen = useRef(false)
  useEffect(() => {
    panelOpen.current = panel !== null || note !== null
  }, [panel, note])
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
  // After the woodshed, HUGO leads the guest on to the brook (A48, Eduard's
  // line). The scene says when (brook.ts, readyForBrook); if a reading panel
  // is open then, he waits until it's closed.
  const [brookLead, setBrookLead] = useState(false)
  const brookWaiting = useRef(false)
  const startBrookLead = useCallback(() => {
    if (panelOpen.current) {
      brookWaiting.current = true
      return
    }
    setBrookLead(true)
    setBubble({ speaker: 'HUGO', text: HUGO_BROOK_LEAD_LINE })
    later(6000, () => setBubble((b) => (b?.text === HUGO_BROOK_LEAD_LINE ? null : b)))
  }, [later])
  /** How far round the tour the guest has got (for where HUGO points them next). */
  const tour = useRef({
    cabin: reached(resumed, 'woodshed'),
    inside: false,
    brook: reached(resumed, 'brook'),
    fire: reached(resumed, 'fire'),
    lastNudge: 0,
  })
  const onReachBrook = useCallback(() => {
    brookWaiting.current = false
    tour.current.brook = true
    hit((cp) => reach(cp, 'brook'))
  }, [hit])

  // The fire (scene 7). When the guest's done at the brook, HUGO calls them
  // back (approved line, A50); from then on night falls, Eduard lights the
  // fire and sits by it (the scene does that part).
  const [fireLead, setFireLead] = useState(false)
  const fireLeadOn = useRef(false)
  useEffect(() => {
    fireLeadOn.current = fireLead
  }, [fireLead])
  const fireWaiting = useRef(false)
  const startFireLead = useCallback(() => {
    if (panelOpen.current) {
      fireWaiting.current = true
      return
    }
    // (the camera cuts to the fire with his line as a caption; when it comes
    // back the line is over his head)
    setBubble(null)
    setFireLead(true)
  }, [])
  const [fireCut, setFireCut] = useState(false)
  const onFireCut = useCallback(
    (showing: boolean) => {
      setFireCut(showing)
      if (showing) return
      setBubble({ speaker: 'HUGO', text: HUGO_FIRE_LEAD_LINE })
      later(5000, () => setBubble((b) => (b?.text === HUGO_FIRE_LEAD_LINE ? null : b)))
    },
    [later],
  )
  const onReachFire = useCallback(() => {
    tour.current.fire = true
    hit((cp) => reach(cp, 'fire'))
    const text = EDUARD_FIRE_LINES.welcome
    setBubble({ speaker: 'Eduard', text })
    later(5000, () => setBubble((b) => (b?.text === text ? null : b)))
  }, [later, hit])
  // Sitting down by the fire puts the questions for Eduard up (A30); getting
  // up after asking him something is the end of the visit: he waves them off
  // ("Come back anytime."), HUGO points at the corner bar, and Résumé and
  // Contact light up there (storyboard scene 7).
  const [fireSeated, setFireSeated] = useState(false)
  // (what they'd asked him before a reload keeps its tick)
  const [asked, setAsked] = useState<string[]>(() => resumed?.asked ?? [])
  const [eduardTalking, setEduardTalking] = useState(false)
  /** What's being said by the fire (over the speaker's head), and whether the things to ask are up. */
  const [fireSpeech, setFireSpeech] = useState<FireSpeech | null>(null)
  const [fireChoosing, setFireChoosing] = useState(false)
  const [barLit, setBarLit] = useState(false)
  const farewell = useRef({ asked: (resumed?.asked.length ?? 0) > 0, said: false })
  const onFireSeat = useCallback(
    (seated: boolean) => {
      setFireSeated(seated)
      if (seated) {
        closeAsk.current()
        setBubble(null)
        onGoal('fire')
        return
      }
      const f = farewell.current
      if (!f.asked || f.said) return
      f.said = true
      setBarLit(true)
      setGreeting('guest')
      setBubble({ speaker: 'Eduard', text: EDUARD_FIRE_LINES.goodbye })
      later(3600, () => {
        setGreeting(false)
        setBubble({ speaker: 'HUGO', text: HUGO_GOODBYE_LINE })
      })
      later(10500, () => setBubble((b) => (b?.text === HUGO_GOODBYE_LINE ? null : b)))
    },
    [later, onGoal],
  )
  const onFireAsk = useCallback(
    (id: string) => {
      farewell.current.asked = true
      setAsked((a) => (a.includes(id) ? a : [...a, id]))
      hit((cp) => withAsked(cp, id))
    },
    [hit],
  )

  const closePanel = useCallback(() => {
    setPanel(null)
    setNote(null)
    panelOpen.current = false
    if (lead.current.waiting) {
      lead.current.waiting = false
      startLead()
    }
    if (brookWaiting.current) {
      brookWaiting.current = false
      startBrookLead()
    }
    if (fireWaiting.current) {
      fireWaiting.current = false
      startFireLead()
    }
  }, [startLead, startBrookLead, startFireLead])

  // In the cabin HUGO says Eduard's line, then floats over to the table and
  // points the résumé out (unless the guest has picked it up already).
  const onEnterCabin = useCallback(() => {
    tour.current.cabin = true
    tour.current.inside = true
    setBubble({ speaker: 'HUGO', text: HUGO_CABIN_LINE })
    later(6500, () => {
      setBubble((b) => (b?.text === HUGO_CABIN_LINE ? null : b))
      // (not if they've read it already, or walked straight back out)
      if (resumeRead.current || !tour.current.inside) return
      setPointsAt('resume')
      setBubble({ speaker: 'HUGO', text: HUGO_RESUME_LINE })
    })
    later(15000, () => {
      setPointsAt((p) => (p === 'resume' ? null : p))
      setBubble((b) => (b?.text === HUGO_RESUME_LINE ? null : b))
    })
  }, [later])

  // As soon as the guest walks back out of the cabin, HUGO takes them on a
  // little walk to the woodshed (Eduard; it used to start ten seconds after
  // they walked in, while they were still looking round).
  const onLeaveCabin = useCallback(() => startLead(), [startLead])

  // At the woodshed HUGO floats over to the workbench he's been leading them
  // to and points the project boxes out (unless the guest has found them
  // already); then Eduard's line about the wood.
  const benchSeen = useRef(reached(resumed, 'brook'))
  const onReachWoodshed = useCallback(() => {
    reachedWoodshed.current = true
    hit((cp) => reach(cp, 'woodshed'))
    const wood = () => {
      setPointsAt((p) => (p === 'bench' ? null : p))
      setBubble({ speaker: 'HUGO', text: HUGO_WOODSHED_LINE })
      later(7000, () => setBubble((b) => (b?.text === HUGO_WOODSHED_LINE ? null : b)))
    }
    if (benchSeen.current) {
      wood()
      return
    }
    setPointsAt('bench')
    setBubble({ speaker: 'HUGO', text: HUGO_WORKBENCH_LINE })
    later(8500, () => {
      // (if they're at the boxes by now, he keeps the wood for later)
      if (benchSeen.current) setBubble((b) => (b?.text === HUGO_WORKBENCH_LINE ? null : b))
      else wood()
    })
  }, [later, hit])

  // HUGO was left behind and has teleported back to the guest: he says where
  // the tour goes next (and picks the lead up again).
  const onHugoCatchUp = useCallback(() => {
    const t = tour.current
    const now = performance.now()
    if (now - t.lastNudge < 12000) return
    const say = (text: string) => {
      t.lastNudge = now
      setBubble({ speaker: 'HUGO', text })
      later(6000, () => setBubble((b) => (b?.text === text ? null : b)))
    }
    // (while they're looking round inside the cabin he doesn't hurry them on)
    if (t.inside) return
    if (!t.cabin) say(HUGO_CATCH_UP_CABIN)
    else if (!benchSeen.current) {
      if (!lead.current.started && !reachedWoodshed.current) startLead()
      else say(HUGO_LEAD_LINE)
    } else if (!t.brook) {
      setBrookLead(true)
      say(HUGO_BROOK_LEAD_LINE)
    } else if (fireLeadOn.current && !t.fire) say(HUGO_FIRE_LEAD_LINE)
  }, [later, startLead])

  // HUGO says a line about each easter egg the guest looks at.
  const onLook = useCallback(
    (id: 'basket' | 'rod' | 'tackle' | 'yahtzee') => {
      const text = id === 'yahtzee' ? HUGO_YAHTZEE_LINE : HUGO_LOOK_LINES[id]
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

  // Casting a line at the fishing hole (fishing.ts): the HUD while it's on.
  const onFishing = useCallback((active: boolean) => setFishing(active), [])
  const onFishingFrame = useCallback((s: FishingHudState) => fishingHud.current?.set(s), [])

  // HUGO's questions (A48): tap HUGO or press Q. Opening his card puts away
  // a reading panel or a box; opening one of those puts his card away.
  const ask = useHugoAsk({
    blocked: splitting || fishing,
    onOpen: () => {
      if (panelOpen.current) closePanel()
      setWantBox(null)
    },
  })
  useEffect(() => {
    closeAsk.current = ask.close
  }, [ask.close])
  // (which stop the guest is at says whether they're inside the cabin)
  useEffect(() => {
    tour.current.inside = ask.stop === 'cabin'
  }, [ask.stop])
  useEffect(() => {
    seenBench.current = () => {
      benchSeen.current = true
      setPointsAt((p) => (p === 'bench' ? null : p))
      setBubble((b) => (b?.text === HUGO_WORKBENCH_LINE ? null : b))
    }
  }, [])
  // What HUGO says back to a question goes in a bubble over his head (not on his card).
  const [hugoSaying, setHugoSaying] = useState<HugoSaying | null>(null)
  const askMarker =
    ready &&
    ask.unasked &&
    !ask.open &&
    !splitting &&
    !fishing &&
    panel === null &&
    note === null &&
    wantBox === null &&
    !fireSeated

  // A link under something HUGO or Eduard said, to one of the projects'
  // pages, brings a note about it up over the scene instead of leaving the
  // cabin (Eduard: HUGO's page "should be just a note that opens up on the
  // page instead of going to like projects/Hugo"). Anything else (the résumé,
  // Contact, a live app) is still a link.
  const onLink = useCallback(
    (l: BubbleLink) => {
      const slug = projectSlug(l.href)
      const p = slug === null ? undefined : notes.find((n) => n.slug === slug)
      if (!p) return false
      closeAsk.current()
      setWantBox(null)
      setPanel(null)
      setNote(p)
      return true
    },
    [notes],
  )

  // "Back at the woodshed, where you left off.": a few seconds once the scene's up.
  useEffect(() => {
    if (!ready || !resumeNote) return
    const id = window.setTimeout(() => setResumeNote(false), 10000)
    return () => window.clearTimeout(id)
  }, [ready, resumeNote])
  const startOver = useCallback(() => {
    clearCheckpoint()
    window.location.reload()
  }, [])

  const found = { done: countDone(progress), all: GOALS.length }
  const controlsOpen = controlsHidden !== 'yes'

  // The cabin can't run here: the plain note, on screen, is the page.
  if (webgl === false || sceneFailed)
    return (
      <div className={styles.stage}>
        <PlainNote resume={resume} shown />
      </div>
    )

  return (
    <div className={styles.stage}>
      <PlainNote resume={resume} shown={false} />
      {webgl && (
        <SceneBoundary onError={onSceneError}>
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
            brookLead={brookLead}
            onBrookReady={startBrookLead}
            onReachBrook={onReachBrook}
            onFishing={onFishing}
            onFishingFrame={onFishingFrame}
            onStop={ask.onStop}
            onTapHugo={ask.toggle}
            hugoAskMarker={askMarker}
            hugoTalking={ask.talking}
            hugoAskOpen={ask.open}
            hugoSaying={ask.open ? hugoSaying : null}
            hugoPointsAt={pointsAt}
            onHugoCatchUp={onHugoCatchUp}
            startAtNight={startAtNight}
            resumeAt={resumed?.at ?? null}
            onLink={onLink}
            fireLead={fireLead}
            onFireReady={startFireLead}
            onReachFire={onReachFire}
            onFireSeat={onFireSeat}
            fireSpeech={fireSeated && !ask.open ? fireSpeech : null}
            fireChoosing={fireChoosing}
            eduardTalking={eduardTalking}
            onFireCut={onFireCut}
          />
        </SceneBoundary>
      )}
      <FireTalk
        open={fireSeated && !ask.open && note === null}
        touch={touch}
        asked={asked}
        onAsk={onFireAsk}
        onLeave={() => api.current?.getUp()}
        onAskHugo={ask.show}
        onSpeech={setFireSpeech}
        onTalking={setEduardTalking}
        onChoosing={setFireChoosing}
      />
      {/* HUGO's call back to the fire: the camera's away at it, with his line under the picture */}
      {fireCut && (
        <div className={styles.cut} aria-live="polite">
          <p className={`${styles.cutLine} ${styles.pixel}`}>
            <span className={`${styles.speaker} ${styles.speakerHugo}`}>HUGO</span>
            {HUGO_FIRE_LEAD_LINE}
          </p>
        </div>
      )}
      {panel === 'resume' && <ResumePanel resume={resume} onClose={closePanel} />}
      {panel === 'todo' && <TodoPanel items={TODO_LIST} onClose={closePanel} />}
      {panel === 'workbench' && (
        <WorkbenchIndex projects={projects} onPick={onOpenBox} onClose={closePanel} />
      )}
      {wantBox !== null && (
        <BoxCard projects={projects} index={wantBox} onPick={onOpenBox} onClose={onCloseBox} />
      )}
      {note && <ProjectNote key={note.slug} project={note} onClose={closePanel} />}
      {splitting && (
        <SplitHud
          touch={touch}
          handleRef={splitHud}
          onSwing={() => api.current?.swing()}
          onDone={() => api.current?.stopSplit()}
        />
      )}
      {fishing && (
        <FishingHud
          touch={touch}
          handleRef={fishingHud}
          onPress={() => api.current?.fish()}
          onDone={() => api.current?.stopFishing()}
        />
      )}
      {checklistOpen && (
        <ChecklistCard progress={progress} onClose={() => setChecklistOpen(false)} />
      )}
      {ask.ever && (
        <HugoAsk
          stop={ask.stop}
          open={ask.open}
          touch={touch}
          onClose={ask.close}
          onTalking={ask.setTalking}
          onSay={setHugoSaying}
        />
      )}
      {toast && <GoalToast key={toast.key} text={toast.text} />}
      {ready && resumeNote && resumed && (
        <div className={`${styles.resumed} ${styles.pixel}`} role="status" aria-live="polite">
          <span>Back at {CHECKPOINT_NAMES[resumed.at]}, where you left off.</span>
          <button type="button" className={styles.paperClose} onClick={startOver}>
            Start over
          </button>
        </div>
      )}
      <p className={`${styles.title} ${styles.pixel}`}>Eduard Kakosyan</p>
      <CornerBar
        lofi={lofi}
        onToggleLofi={() => setLofi((v) => !v)}
        found={found}
        checklistOpen={checklistOpen}
        onToggleChecklist={() => setChecklistOpen((v) => !v)}
        controlsOpen={controlsOpen}
        onToggleControls={() => setControlsHidden(controlsOpen ? 'yes' : 'no')}
        highlight={barLit}
      />
      {ready &&
        controlsOpen &&
        !splitting &&
        !fishing &&
        wantBox === null &&
        !ask.open &&
        !fireSeated && (
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
