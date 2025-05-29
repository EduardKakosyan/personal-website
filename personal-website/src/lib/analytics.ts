import { track } from '@vercel/analytics';

/**
 * Analytics utility functions for tracking custom events
 */

type EventProperties = Record<string, string | number | boolean>;

/**
 * Track a custom event
 * @param event - The event name
 * @param properties - Optional properties to send with the event
 */
export function trackEvent(event: string, properties?: EventProperties) {
  if (process.env.NODE_ENV === 'production') {
    track(event, properties);
  } else {
    console.debug('Analytics Event:', { event, properties });
  }
}

/**
 * Pre-defined analytics events for common actions
 */
export const analyticsEvents = {
  // Project interactions
  projectViewed: (projectSlug: string) => 
    trackEvent('Project Viewed', { project: projectSlug }),
  
  projectLinkClicked: (projectSlug: string, linkType: 'live' | 'repo') => 
    trackEvent('Project Link Clicked', { project: projectSlug, type: linkType }),
  
  // Contact interactions
  contactFormSubmitted: () => 
    trackEvent('Contact Form Submitted'),
  
  emailClicked: () => 
    trackEvent('Email Clicked'),
  
  linkedinClicked: () => 
    trackEvent('LinkedIn Clicked'),
  
  githubClicked: () => 
    trackEvent('GitHub Clicked'),
  
  // Navigation
  achievementClicked: (achievement: string) => 
    trackEvent('Achievement Clicked', { achievement }),
  
  heroCtaClicked: (cta: string) => 
    trackEvent('Hero CTA Clicked', { cta }),
  
  // AI Assistant interactions
  chatbotOpened: () => 
    trackEvent('Chatbot Opened'),
  
  chatbotMessageSent: () => 
    trackEvent('Chatbot Message Sent'),
  
  // Blog interactions
  blogPostViewed: (postSlug: string) => 
    trackEvent('Blog Post Viewed', { post: postSlug }),
  
  // Download events
  resumeDownloaded: () => 
    trackEvent('Resume Downloaded'),
  
  // Search events
  siteSearched: (query: string) => 
    trackEvent('Site Searched', { query }),
}; 