'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { CabinResume, TodoItem } from './cabin-content'
import styles from './cabin.module.css'

const WALK_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD'])

/**
 * The paper itself (A102): reading the résumé or the to-do list brings the
 * sheet up in the middle of the screen, over the scene dimmed in the same
 * dither the cabin's cutaway uses. Esc, E, the "put it down" button or a
 * click beside the paper puts it down; walking (WASD) puts it down and walks.
 * ←/→ turn the pages when there are some.
 */
function Paper({
  label,
  kind,
  onClose,
  onTurn,
  page,
  back,
  pin,
  footer,
  children,
}: {
  label: string
  kind: 'resume' | 'todo'
  onClose: () => void
  /** Turn a page (-1 back, +1 on); absent when the paper has one page. */
  onTurn?: (by: -1 | 1) => void
  /** Changes when the page turns, so the new page starts at the top. */
  page?: number
  /** A second sheet peeking out underneath (the résumé is two sheets on the table). */
  back?: boolean
  /** The pin it hangs from (the to-do list on the wall). */
  pin?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)

  // Focus the page (so ↑/↓ scroll it) and start each page at the top.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollTop = 0
    el.focus({ preventScroll: true })
  }, [page])

  // In the capture phase, so the walking keys and E don't reach the scene
  // while the paper is up (E there would pick it straight back up).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (WALK_KEYS.has(e.code)) {
        onClose()
        return
      }
      if (e.code === 'Escape' || e.code === 'KeyE') {
        e.stopPropagation()
        e.preventDefault()
        onClose()
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.stopPropagation()
        e.preventDefault()
        onTurn?.(e.code === 'ArrowLeft' ? -1 : 1)
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        // (scrolls the page)
        e.stopPropagation()
      } else if (e.code === 'Enter' || e.code === 'Space') {
        // (a focused button or link on the paper still gets it)
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, onTurn])

  return (
    <div
      className={`${styles.reading} ${styles.pixel}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`${styles.sheetWrap} ${kind === 'resume' ? styles.sheetWrapResume : styles.sheetWrapTodo}`}
      >
        {back && <div className={styles.sheetBack} aria-hidden="true" />}
        {pin && <PinIcon />}
        <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={label}>
          <div
            key={page}
            ref={scroller}
            className={`${styles.sheetScroll} ${kind === 'todo' ? styles.sheetScrollTodo : ''}`}
            tabIndex={-1}
          >
            {children}
          </div>
          {footer && <div className={styles.sheetFoot}>{footer}</div>}
        </div>
      </div>
      <button type="button" className={styles.putDown} onClick={onClose}>
        <kbd className={`${styles.key} ${styles.putDownKey}`}>Esc</kbd>
        Put it down
      </button>
    </div>
  )
}

/** The pushpin from the wall (the model's is the collar orange), in pixels. */
function PinIcon() {
  return (
    <svg className={styles.pin} viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="0" width="4" height="1" fill="#3b2a1e" />
      <rect x="2" y="1" width="6" height="1" fill="#3b2a1e" />
      <rect x="1" y="2" width="8" height="5" fill="#3b2a1e" />
      <rect x="2" y="7" width="6" height="1" fill="#3b2a1e" />
      <rect x="3" y="8" width="4" height="1" fill="#3b2a1e" />
      <rect x="3" y="1" width="4" height="1" fill="#e0702a" />
      <rect x="2" y="2" width="6" height="5" fill="#e0702a" />
      <rect x="3" y="7" width="4" height="1" fill="#c0392f" />
      <rect x="3" y="2" width="2" height="2" fill="#ffd9a8" />
    </svg>
  )
}

const RESUME_PAGES = 2

export function ResumePanel({ resume, onClose }: { resume: CabinResume; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const turn = (by: -1 | 1) => setPage((p) => Math.min(RESUME_PAGES - 1, Math.max(0, p + by)))
  return (
    <Paper
      label="Résumé"
      kind="resume"
      onClose={onClose}
      onTurn={turn}
      page={page}
      back
      footer={
        <>
          <span className={styles.pager}>
            <button
              type="button"
              className={styles.pagerButton}
              disabled={page === 0}
              onClick={() => turn(-1)}
              aria-label="Previous page"
            >
              ◀
            </button>
            <span>
              {page + 1} of {RESUME_PAGES}
            </span>
            <button
              type="button"
              className={styles.pagerButton}
              disabled={page === RESUME_PAGES - 1}
              onClick={() => turn(1)}
              aria-label="Next page"
            >
              ▶
            </button>
          </span>
          <a className={styles.panelButton} href={resume.pdfPath} download>
            Download PDF
          </a>
        </>
      }
    >
      {page === 0 ? (
        <>
          <h2 className={styles.sheetName}>{resume.name}</h2>
          <p className={styles.sheetSub}>
            {resume.title} · {resume.company} · {resume.location}
          </p>
          <p>{resume.headline}</p>
          <hr className={styles.sheetRule} />
          <h3 className={styles.sheetHeading}>Experience</h3>
          {resume.roles.map((r) => (
            <div key={`${r.org}-${r.dates}`} className={styles.sheetItem}>
              <p className={styles.sheetItemTitle}>
                {r.title}, <span>{r.org}</span>
              </p>
              <p className={styles.sheetMeta}>
                {r.location} · {r.dates}
              </p>
              <p>{r.summary}</p>
            </div>
          ))}
        </>
      ) : (
        <>
          <p className={styles.sheetRunning}>{resume.name}</p>
          <h3 className={styles.sheetHeading}>Education</h3>
          {resume.education.map((e) => (
            <div key={e.degree} className={styles.sheetItem}>
              <p className={styles.sheetItemTitle}>
                {e.degree}, <span>{e.school}</span>
              </p>
              <p className={styles.sheetMeta}>
                {e.dates}
                {e.details.length > 0 && ` · ${e.details.join(' · ')}`}
              </p>
            </div>
          ))}
          <hr className={styles.sheetRule} />
          <h3 className={styles.sheetHeading}>Skills</h3>
          {resume.skills.map((s) => (
            <div key={s.label} className={styles.sheetItem}>
              <p className={styles.sheetItemTitle}>{s.label}</p>
              <p>{s.items.join(', ')}</p>
            </div>
          ))}
        </>
      )}
    </Paper>
  )
}

export function TodoPanel({ items, onClose }: { items: TodoItem[]; onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Paper label="To do" kind="todo" onClose={onClose} pin>
      <h2 className={styles.todoTitle}>To do</h2>
      <ul className={styles.todoList}>
        {items.map((item, i) => (
          <li key={item.text}>
            {item.note ? (
              <button
                type="button"
                className={styles.todoItem}
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className={styles.todoBox} aria-hidden="true" />
                <span className={styles.todoText}>{item.text}</span>
                <span className={styles.todoMore} aria-hidden="true">
                  {open === i ? '▾' : '▸'}
                </span>
              </button>
            ) : (
              <div className={styles.todoItem}>
                <span className={styles.todoBox} aria-hidden="true" />
                <span>{item.text}</span>
              </div>
            )}
            {open === i && item.note && <p className={styles.todoNote}>{item.note}</p>}
          </li>
        ))}
      </ul>
    </Paper>
  )
}
