'use client'

import { useEffect, useRef } from 'react'
import styles from './cabin.module.css'
import { GOALS, countDone, isDone, partsText, type Progress } from './checklist'

/** The guest's list of things to find and do, with what's been ticked off. */
export function ChecklistCard({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const done = countDone(progress)
  const all = done === GOALS.length
  return (
    <div
      ref={ref}
      className={`${styles.checklist} ${styles.pixel}`}
      role="dialog"
      aria-modal="false"
      aria-label="Things to find"
      tabIndex={-1}
    >
      <div className={styles.card}>
        <div className={styles.checklistHead}>
          <h2>Things to find</h2>
          <span className={styles.checklistCount}>
            {done}/{GOALS.length}
          </span>
          <button type="button" className={styles.paperClose} onClick={onClose}>
            Close
          </button>
        </div>
        <ul className={styles.checklistList}>
          {GOALS.map((g) => {
            const ok = isDone(progress, g)
            const parts = partsText(progress, g)
            return (
              <li key={g.id} className={ok ? styles.goalDone : undefined}>
                <span className={styles.goalBox} aria-hidden="true">
                  {ok ? '✓' : ''}
                </span>
                <span className={styles.goalText}>{g.label}</span>
                {parts && !ok && <span className={styles.goalParts}>{parts}</span>}
                <span className="sr-only">{ok ? ', done' : ''}</span>
              </li>
            )
          })}
        </ul>
        {all && <p className={styles.checklistAll}>You found everything. Rusty is impressed.</p>}
      </div>
    </div>
  )
}

/** A little note that pops up when something gets ticked off. */
export function GoalToast({ text }: { text: string }) {
  return (
    <div className={`${styles.toast} ${styles.pixel}`} role="status" aria-live="polite">
      <span className={styles.toastTick} aria-hidden="true">
        ✓
      </span>
      {text}
    </div>
  )
}
