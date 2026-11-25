'use client'

import styles from './cabin.module.css'
import { GUESTS, type Guest } from './world'

type Props = {
  /** Whether this is a touch screen (taps) or a computer (keys and mouse). */
  touch: boolean
  guest: Guest
  onPickGuest: (g: Guest) => void
  onHide: () => void
}

/** A little keycap. */
function Key({ children }: { children: string }) {
  return <kbd className={styles.key}>{children}</kbd>
}

/** A little pixel mouse with one button (or the wheel) lit. */
function Mouse({ button }: { button: 'left' | 'right' | 'wheel' }) {
  return (
    <svg
      className={styles.keyMouse}
      viewBox="0 0 8 11"
      width="14"
      height="19"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d="M1 0h6v1h1v9h-1v1h-6v-1h-1v-9h1z" fill="#3b2a1e" />
      <path d="M1 1h2v3h-2zM5 1h2v3h-2zM1 5h6v4h-1v1h-4v-1h-1z" fill="#fff7e6" />
      <path
        d={
          button === 'left' ? 'M1 1h2v3h-2z' : button === 'right' ? 'M5 1h2v3h-2z' : 'M3 1h2v3h-2z'
        }
        fill="#fec54f"
      />
    </svg>
  )
}

/**
 * A small card saying how to play (Eduard: "a little UI to tell them what the
 * controls are, and they should be able to hide it as well"), with the pick
 * of the guest's character.
 */
export function ControlsCard({ touch, guest, onPickGuest, onHide }: Props) {
  return (
    <section className={`${styles.controls} ${styles.pixel}`} aria-label="Controls">
      <div className={styles.controlsHead}>
        <span>How to play</span>
        <button type="button" className={styles.controlsHide} onClick={onHide} aria-label="Hide">
          Hide
        </button>
      </div>
      <dl className={styles.controlsList}>
        {touch ? (
          <>
            <dt>Walk</dt>
            <dd>Tap the ground</dd>
            <dt>Use</dt>
            <dd>Tap the thing, or its button</dd>
            <dt>Turn</dt>
            <dd>Drag</dd>
            <dt>Zoom</dt>
            <dd>Pinch</dd>
          </>
        ) : (
          <>
            <dt>Walk</dt>
            <dd>
              <span className={styles.keyGroup}>
                <Key>W</Key>
                <Key>A</Key>
                <Key>S</Key>
                <Key>D</Key>
              </span>
              <span className={styles.keyGroup}>
                <Key>↑</Key>
                <Key>←</Key>
                <Key>↓</Key>
                <Key>→</Key>
              </span>
              <span className={styles.keyGroup}>
                <Mouse button="left" /> click
              </span>
            </dd>
            <dt>Use</dt>
            <dd>
              <span className={styles.keyGroup}>
                <Key>E</Key>
              </span>
              <span className={styles.keyGroup}>
                <Mouse button="left" /> click the thing
              </span>
              <span className={styles.keyGroup}>
                <Mouse button="right" />
              </span>
            </dd>
            <dt>Turn</dt>
            <dd>
              <span className={styles.keyGroup}>
                <Mouse button="left" /> drag
              </span>
            </dd>
            <dt>Zoom</dt>
            <dd>
              <span className={styles.keyGroup}>
                <Mouse button="wheel" /> scroll
              </span>
            </dd>
            <dt>Close</dt>
            <dd>
              <Key>Esc</Key>
            </dd>
          </>
        )}
        <dt>Character</dt>
        <dd>
          <GuestChoice guest={guest} onPick={onPickGuest} />
        </dd>
      </dl>
    </section>
  )
}

/** The two characters to pick from, as little portraits (no gender assumed, A99). */
export function GuestChoice({ guest, onPick }: { guest: Guest; onPick: (g: Guest) => void }) {
  return (
    <span className={styles.guestChoice} role="radiogroup" aria-label="Your character">
      {GUESTS.map((g, i) => (
        <button
          key={g.id}
          type="button"
          role="radio"
          aria-checked={guest === g.id}
          aria-label={g.label}
          className={styles.guestOption}
          onClick={() => onPick(g.id)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a tiny pixel portrait, no optimisation wanted */}
          <img src={g.portrait} alt="" width={32} height={32} />
          <span>{i + 1}</span>
        </button>
      ))}
    </span>
  )
}
