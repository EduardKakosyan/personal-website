import { LabHome } from '@/components/features/lab-home'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Eduard Kakosyan — Local AI & Autonomous Systems',
  description:
    'Eduard Kakosyan is an AI developer in Halifax. Projects include local coding agents, a voice-controlled robot, and business software.',
}
export default function HomePage() {
  return <LabHome />
}
