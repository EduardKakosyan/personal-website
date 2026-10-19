import { track } from '@vercel/analytics'

/**
 * Analytics utility functions for tracking custom events
 */

type EventProperties = Record<string, string | number | boolean>

/**
 * Track a custom event
 * @param event - The event name
 * @param properties - Optional properties to send with the event
 */
export function trackEvent(event: string, properties?: EventProperties) {
  if (process.env.NODE_ENV === 'production') {
    track(event, properties)
  } else {
    console.debug('Analytics Event:', { event, properties })
  }
}

/**
 * Pre-defined analytics events for common actions
 */
export const analyticsEvents = {
  // Project interactions
  projectViewed: (projectSlug: string) => trackEvent('Project Viewed', { project: projectSlug }),

  projectLinkClicked: (projectSlug: string, linkType: 'live' | 'repo') =>
    trackEvent('Project Link Clicked', { project: projectSlug, type: linkType }),

  // Download events (wired to the header Résumé button in Phase 2)
  resumeDownloaded: () => trackEvent('Resume Downloaded'),
}
