'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { CabinResume, TodoItem } from './cabin-content'
import styles from './cabin.module.css'

/**
 * A calm reading panel over the scene (A43): clean font, pixel header. Closes
 * with Escape or the Close button, and takes focus so keyboards can use it.
 */
function Panel({
  title,
  onClose,
  children,
  actions,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
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
      className={styles.panel}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      ref={ref}
      tabIndex={-1}
    >
      <div className={`${styles.panelHeader} ${styles.pixel}`}>
        <span>{title}</span>
        <button type="button" className={styles.panelClose} onClick={onClose}>
          Close
        </button>
      </div>
      <div className={styles.panelBody}>{children}</div>
      {actions && <div className={styles.panelActions}>{actions}</div>}
    </div>
  )
}

export function ResumePanel({ resume, onClose }: { resume: CabinResume; onClose: () => void }) {
  return (
    <Panel
      title="Résumé"
      onClose={onClose}
      actions={
        <a className={`${styles.panelButton} ${styles.pixel}`} href={resume.pdfPath} download>
          Download PDF
        </a>
      }
    >
      <h2 className={styles.resumeName}>{resume.name}</h2>
      <p className={styles.resumeMeta}>
        {resume.title} · {resume.company} · {resume.location}
      </p>
      <p>{resume.headline}</p>

      <h3 className={styles.resumeSection}>Experience</h3>
      {resume.roles.map((r) => (
        <div key={`${r.org}-${r.dates}`} className={styles.resumeItem}>
          <p className={styles.resumeItemTitle}>
            <strong>{r.title}</strong>, {r.org}
          </p>
          <p className={styles.resumeMeta}>
            {r.location} · {r.dates}
          </p>
          <p>{r.summary}</p>
        </div>
      ))}

      <h3 className={styles.resumeSection}>Education</h3>
      {resume.education.map((e) => (
        <div key={e.degree} className={styles.resumeItem}>
          <p className={styles.resumeItemTitle}>
            <strong>{e.degree}</strong>, {e.school}
          </p>
          <p className={styles.resumeMeta}>
            {e.dates}
            {e.details.length > 0 && ` · ${e.details.join(' · ')}`}
          </p>
        </div>
      ))}

      <h3 className={styles.resumeSection}>Skills</h3>
      {resume.skills.map((s) => (
        <p key={s.label}>
          <strong>{s.label}:</strong> {s.items.join(', ')}
        </p>
      ))}
    </Panel>
  )
}

export function TodoPanel({ items, onClose }: { items: TodoItem[]; onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Panel title="To do" onClose={onClose}>
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
    </Panel>
  )
}
