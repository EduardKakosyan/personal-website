'use client'

import { useEffect, useRef } from 'react'
import type { BenchProject } from './cabin-content'
import { BoxIcon } from './box-icons'
import styles from './cabin.module.css'

/**
 * What's in one of the project boxes on the workbench: the card that opens
 * while the guest holds the thing out of the box. Prev/next hop along the
 * bench to the neighbouring boxes.
 */
export function BoxCard({
  projects,
  index,
  onPick,
  onClose,
}: {
  projects: BenchProject[]
  index: number
  onPick: (index: number) => void
  onClose: () => void
}) {
  const p = projects[index]
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [index])
  useEffect(() => {
    // (in the capture phase, so ←/→ hop boxes without also walking the guest off)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopPropagation()
        e.preventDefault()
        if (e.key === 'ArrowLeft' && index > 0) onPick(index - 1)
        else if (e.key === 'ArrowRight' && index < projects.length - 1) onPick(index + 1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [index, onClose, onPick, projects.length])
  if (!p) return null
  const prev = projects[index - 1]
  const next = projects[index + 1]
  return (
    <div
      ref={ref}
      className={`${styles.boxCard} ${styles.pixel}`}
      role="dialog"
      aria-modal="false"
      aria-label={p.title}
      tabIndex={-1}
    >
      <div className={styles.card}>
        <div className={styles.boxCardHead}>
          <div className={styles.boxCardIcon}>
            <BoxIcon slug={p.slug} size={56} />
          </div>
          <div className={styles.boxCardTitle}>
            <span className={styles.boxCardLabel}>
              Box {index + 1} of {projects.length}
            </span>
            <h2>{p.title}</h2>
            <span className={styles.boxCardWhen}>{p.when}</span>
          </div>
          <button type="button" className={styles.paperClose} onClick={onClose}>
            Put back
          </button>
        </div>
        <div className={styles.boxCardBody}>
          <p className={styles.boxCardWhat}>{p.what}</p>
          <p>{p.detail}</p>
          <p className={styles.boxCardRole}>
            <span>Eduard’s part</span>
            {p.role}
          </p>
          <p className={styles.boxCardLinks}>
            <a className={styles.panelButton} href={`/projects/${p.slug}`}>
              The full story
            </a>
            {p.links.map((l) => (
              <a
                key={l.href}
                className={styles.panelButtonQuiet}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.label}
              </a>
            ))}
          </p>
        </div>
        <div className={styles.boxCardNav}>
          <button
            type="button"
            className={styles.boxCardNavButton}
            disabled={!prev}
            onClick={() => prev && onPick(index - 1)}
          >
            ◀ {prev ? prev.tag : '—'}
          </button>
          <button
            type="button"
            className={styles.boxCardNavButton}
            disabled={!next}
            onClick={() => next && onPick(index + 1)}
          >
            {next ? next.tag : '—'} ▶
          </button>
        </div>
      </div>
    </div>
  )
}

/** The whole bench at a glance: one button per box, with its icon. */
export function WorkbenchIndex({
  projects,
  onPick,
  onClose,
}: {
  projects: BenchProject[]
  onPick: (index: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      ref={ref}
      className={`${styles.boxCard} ${styles.pixel}`}
      role="dialog"
      aria-modal="false"
      aria-label="On the workbench"
      tabIndex={-1}
    >
      <div className={styles.card}>
        <div className={styles.boxCardHead}>
          <div className={styles.boxCardTitle}>
            <span className={styles.boxCardLabel}>The workbench</span>
            <h2>Six boxes</h2>
            <span className={styles.boxCardWhen}>Things Eduard built before. Open one.</span>
          </div>
          <button type="button" className={styles.paperClose} onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.boxGrid}>
          {projects.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              className={styles.boxGridItem}
              onClick={() => onPick(i)}
            >
              <BoxIcon slug={p.slug} size={48} />
              <span>{p.tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
