'use client'
import { useEffect, useRef } from 'react'
import { personaOrder, type ChapterId, type Persona } from '@/content/story'
import { analyticsEvents } from '@/lib/analytics'

export function ChapterObserver({
  persona,
  onChange,
}: {
  persona: Persona
  onChange: (id: ChapterId) => void
}) {
  const reached = useRef(new Set<string>())
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries
          .filter((item) => item.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (!entry) return
        const id = entry.target.id as ChapterId
        onChange(id)
        const key = `${persona}:${id}`
        if (!reached.current.has(key)) {
          reached.current.add(key)
          analyticsEvents.chapterReached(id, persona)
        }
      },
      { rootMargin: '-20% 0px -45% 0px', threshold: 0 },
    )
    for (const id of personaOrder[persona]) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [persona, onChange])
  return null
}
