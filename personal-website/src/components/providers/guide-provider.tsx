'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type GuideMood =
  | 'idle'
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'presenting'
  | 'navigating'
  | 'confused'
interface GuideContextValue {
  open: boolean
  mood: GuideMood
  prompt: string | null
  target: HTMLElement | null
  pointAt: (element: HTMLElement | null) => void
  openGuide: (prompt?: string) => void
  closeGuide: () => void
  clearPrompt: () => void
  setMood: (mood: GuideMood) => void
}
const GuideContext = createContext<GuideContextValue | null>(null)
export function useGuide() {
  const value = useContext(GuideContext)
  if (!value) throw new Error('GuideProvider is required')
  return value
}
export function GuideProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<GuideMood>('idle')
  const [prompt, setPrompt] = useState<string | null>(null)
  const [target, pointAt] = useState<HTMLElement | null>(null)
  const openGuide = useCallback((question?: string) => {
    setOpen(true)
    setMood((current) => (current === 'idle' ? 'ready' : current))
    if (question) setPrompt(question)
  }, [])
  const closeGuide = useCallback(() => {
    setOpen(false)
    setMood('idle')
    setPrompt(null)
  }, [])
  const clearPrompt = useCallback(() => setPrompt(null), [])
  return (
    <GuideContext.Provider
      value={{ open, mood, prompt, target, pointAt, openGuide, closeGuide, clearPrompt, setMood }}
    >
      {children}
    </GuideContext.Provider>
  )
}
