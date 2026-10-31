'use client'

import styles from './cabin.module.css'

/** Which input the prompt shows: a mouse with its right button lit, or a tappable button. */
export type PromptInput = 'right-click' | 'tap'

/**
 * A small prompt over something you can interact with ("show interactions",
 * Eduard). On a computer it shows which mouse button to use; on a touch screen
 * it is itself the button.
 */
export function InteractPrompt({
  label,
  input,
  onPress,
}: {
  label: string
  input: PromptInput
  onPress: () => void
}) {
  if (input === 'tap') {
    return (
      <button
        type="button"
        className={`${styles.prompt} ${styles.promptButton} ${styles.pixel}`}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPress()
        }}
      >
        {label}
      </button>
    )
  }
  return (
    <div className={`${styles.prompt} ${styles.pixel}`} aria-label={`Right-click to ${label}`}>
      <MouseIcon />
      <span>{label}</span>
    </div>
  )
}

/** A little pixel mouse with the right button highlighted. */
function MouseIcon() {
  return (
    <svg
      className={styles.promptMouse}
      viewBox="0 0 8 11"
      width="16"
      height="22"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d="M1 0h6v1h1v9h-1v1h-6v-1h-1v-9h1z" fill="#3b2a1e" />
      <path d="M1 1h2v3h-2zM1 5h6v4h-1v1h-4v-1h-1z" fill="#fff7e6" />
      <path d="M5 1h2v3h-2z" fill="#fec54f" />
    </svg>
  )
}
