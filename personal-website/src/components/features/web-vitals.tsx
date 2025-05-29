'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Only report in production and when Analytics is available
    if (process.env.NODE_ENV === 'production') {
      // Send to Vercel Analytics (handled automatically by @vercel/analytics)
      console.debug('Web Vital:', metric)
      
      // You can also send to other analytics services here
      // Example: Send to custom endpoint
      // fetch('/api/analytics', {
      //   method: 'POST',
      //   body: JSON.stringify(metric),
      //   headers: { 'Content-Type': 'application/json' }
      // })
    }
  })

  return null
} 