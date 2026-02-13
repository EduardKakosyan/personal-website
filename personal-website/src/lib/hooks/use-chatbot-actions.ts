'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { FunctionCallResult } from '@/lib/chatbot-functions'

export function useChatbotActions() {
  const router = useRouter()

  const executeAction = useCallback(
    (result: FunctionCallResult) => {
      switch (result.function) {
        case 'navigate_to_page':
          router.push(result.args.page)
          break
        case 'show_project':
          router.push(result.args.project)
          break
        case 'scroll_to_section': {
          const el = document.querySelector(result.args.selector)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          }
          break
        }
      }
    },
    [router],
  )

  return { executeAction }
}
