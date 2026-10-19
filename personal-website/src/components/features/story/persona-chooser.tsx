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
      <legend>What brings you here?</legend>
      <p className="site-muted">Pick one and the most relevant work comes first.</p>
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
