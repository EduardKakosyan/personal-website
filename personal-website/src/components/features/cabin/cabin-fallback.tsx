'use client'

import { Component, type ReactNode } from 'react'
import Link from 'next/link'
import type { CabinResume } from './cabin-content'
import styles from './cabin.module.css'

/** Whether this browser can draw the cabin: WebGL 2, or WebGL 1. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    // (the scene makes its own context; let this one go)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/** Catches the 3D scene failing (WebGL, a model that won't load), so the plain note can stand in. */
export class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('The cabin scene failed:', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** The headline's first sentence, for the line under the name. */
const firstSentence = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text

/**
 * The plain note: who Eduard is, and links to the plain pages. It's always in
 * the page, so search engines and screen readers have it. On screen it's a
 * paper card only when the cabin can't run (no WebGL, the scene failed, or no
 * JavaScript), or while keyboard focus is on its links.
 */
export function PlainNote({ resume, shown }: { resume: CabinResume; shown: boolean }) {
  return (
    <div className={shown ? undefined : styles.plainQuiet}>
      {/* No JavaScript: the card instead of the loading line and the game's corner bar. */}
      <noscript>
        <style>{`.${styles.plainQuiet}{display:contents}.${styles.plain}{white-space:normal}.${styles.loading},.${styles.bar},.${styles.title}{display:none}`}</style>
      </noscript>
      <div className={styles.plain}>
        <div className={styles.plainWrap}>
          <div className={`${styles.card} ${styles.plainCard} ${styles.pixel}`}>
            <h1 className={styles.sheetName}>{resume.name}</h1>
            <p className={styles.sheetSub}>{`${resume.title} at ${resume.company}`}</p>
            <p>{firstSentence(resume.headline)}</p>
            <hr className={styles.sheetRule} />
            {shown && <p>The cabin needs a browser with 3D graphics. Everything is also here:</p>}
            <noscript>
              <p>
                The cabin needs JavaScript and a browser with 3D graphics. Everything is also here:
              </p>
            </noscript>
            <nav className={styles.plainLinks} aria-label="Pages">
              <Link className={styles.panelButton} href="/projects">
                Work
              </Link>
              <a
                className={styles.panelButtonQuiet}
                href={resume.pdfPath}
                target="_blank"
                rel="noreferrer"
              >
                Résumé
              </a>
              <Link className={styles.panelButtonQuiet} href="/about">
                About
              </Link>
              <Link className={styles.panelButtonQuiet} href="/contact">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
