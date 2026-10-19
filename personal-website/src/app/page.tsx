import { StoryHome } from '@/components/features/story/story-home'
import { profile } from '@/content/profile'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Eduard Kakosyan — AI Developer',
  description: profile.headline,
}
export default function HomePage() {
  return <StoryHome />
}
