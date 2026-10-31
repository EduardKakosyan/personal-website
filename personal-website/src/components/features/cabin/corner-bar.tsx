'use client'

import Link from 'next/link'
import { resumePdfPath } from '@/content/profile'
import styles from './cabin.module.css'

type Props = {
  sound: boolean
  lofi: boolean
  onToggleSound: () => void
  onToggleLofi: () => void
}

/** Always-visible quick links for people in a hurry (A43). */
export function CornerBar({ sound, lofi, onToggleSound, onToggleLofi }: Props) {
  return (
    <nav className={`${styles.bar} ${styles.pixel}`} aria-label="Quick links">
      <Link className={styles.barItem} href="/projects">
        Work
      </Link>
      <a className={styles.barItem} href={resumePdfPath} target="_blank" rel="noreferrer">
        Résumé
      </a>
      <Link className={styles.barItem} href="/contact">
        Contact
      </Link>
      <button type="button" className={styles.barItem} aria-pressed={sound} onClick={onToggleSound}>
        Sound
      </button>
      <button type="button" className={styles.barItem} aria-pressed={lofi} onClick={onToggleLofi}>
        Lo-Fi
      </button>
    </nav>
  )
}
