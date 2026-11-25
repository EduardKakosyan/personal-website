'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { resumePdfPath } from '@/content/profile'
import styles from './cabin.module.css'

type Props = {
  lofi: boolean
  onToggleLofi: () => void
  /** The guest's checklist: how many of how many, and whether its card is open. */
  found: { done: number; all: number }
  checklistOpen: boolean
  onToggleChecklist: () => void
  controlsOpen: boolean
  onToggleControls: () => void
  /** The end of the visit (the fire): Résumé and Contact light up. */
  highlight?: boolean
}

/** Always-visible quick links for people in a hurry (A43), plus the game's own bits. */
export function CornerBar({
  lofi,
  onToggleLofi,
  found,
  checklistOpen,
  onToggleChecklist,
  controlsOpen,
  onToggleControls,
  highlight = false,
}: Props) {
  const lit = highlight ? ` ${styles.barItemLit}` : ''
  // On a phone the bar sits along the bottom and wraps onto two rows on a
  // narrow one. The cards and HUDs that sit above it read its height from
  // --bar-clear on the stage, so they never cover its buttons.
  const nav = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = nav.current
    const stage = el?.parentElement
    if (!el || !stage) return
    const measure = () =>
      stage.style.setProperty(
        '--bar-clear',
        `${Math.round(window.innerHeight - el.getBoundingClientRect().top + 8)}px`,
      )
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      watch.disconnect()
      window.removeEventListener('resize', measure)
      stage.style.removeProperty('--bar-clear')
    }
  }, [])
  return (
    <nav ref={nav} className={`${styles.bar} ${styles.pixel}`} aria-label="Quick links">
      <Link className={styles.barItem} href="/projects">
        Work
      </Link>
      <a className={styles.barItem + lit} href={resumePdfPath} target="_blank" rel="noreferrer">
        Résumé
      </a>
      <Link className={styles.barItem + lit} href="/contact">
        Contact
      </Link>
      <button
        type="button"
        className={styles.barItem}
        aria-pressed={checklistOpen}
        onClick={onToggleChecklist}
      >
        Finds {found.done}/{found.all}
      </button>
      <button
        type="button"
        className={styles.barItem}
        aria-pressed={controlsOpen}
        onClick={onToggleControls}
        aria-label="How to play"
      >
        ?
      </button>
      <button type="button" className={styles.barItem} aria-pressed={lofi} onClick={onToggleLofi}>
        Lo-Fi
      </button>
    </nav>
  )
}
