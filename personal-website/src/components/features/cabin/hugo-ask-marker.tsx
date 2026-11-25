'use client'

import type { PromptInput } from './interact-prompt'
import cabin from './cabin.module.css'
import styles from './hugo-ask.module.css'

/**
 * The little "Ask" prompt over HUGO at a stop where the guest hasn't asked
 * him anything yet (A48): Q on a computer, a tap on a phone, or tap HUGO
 * himself. Pressing it opens his card.
 */
export function HugoAskMarker({ input, onPress }: { input: PromptInput; onPress: () => void }) {
  return (
    <button
      type="button"
      className={`${cabin.prompt} ${input === 'tap' ? cabin.promptButton : ''} ${styles.marker} ${cabin.pixel}`}
      aria-label="Ask HUGO (Q)"
      // (a DOM button over the canvas: the press never reaches the ground)
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onPress}
    >
      {input !== 'tap' && <kbd className={cabin.promptKey}>Q</kbd>}
      <span className={styles.markerDot} aria-hidden="true">
        ?
      </span>
      <span>Ask</span>
    </button>
  )
}
