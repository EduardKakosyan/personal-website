'use client'
import { personaLabels, type Persona } from '@/content/story'

export function PersonaChooser({
  persona,
  onChoose,
}: {
  persona: Persona
  onChoose: (persona: Persona) => void
}) {
  return (
    <fieldset className="story-chooser">
      <legend>Who&apos;s visiting?</legend>
      <p className="site-muted">Choose a starting point. The same evidence stays available.</p>
      <div>
        {(Object.keys(personaLabels) as Persona[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === persona}
            onClick={() => onChoose(value)}
          >
            {personaLabels[value]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
