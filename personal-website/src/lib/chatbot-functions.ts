export interface FunctionCallResult {
  function: string
  args: Record<string, string>
  displayText: string
}

const PAGE_MAP: Record<string, string> = {
  home: '/',
  projects: '/projects',
  contact: '/contact',
}

const PROJECT_MAP: Record<string, string> = {
  healthbyte: '/projects/healthbyte',
  cargrep: '/projects/cargrep',
  'second-brain': '/projects/second-brain',
  'network-sim': '/projects/network-sim',
  hugo: '/projects/hugo',
  'acdc-dashboard': '/projects/acdc-dashboard',
  'dev-template': '/projects/dev-template',
  voxcoach: '/projects/voxcoach',
  'claude-autonomous': '/projects/claude-autonomous',
}

const SECTION_MAP: Record<string, string> = {
  hero: '[data-section="hero"]',
  expertise: '[data-section="expertise"]',
  achievements: '[data-section="achievements"]',
  'ai-assistant': '[data-section="ai-assistant"]',
  cta: '[data-section="cta"]',
}

const pageNames = Object.keys(PAGE_MAP).join(', ')
const projectNames = Object.keys(PROJECT_MAP).join(', ')
const sectionNames = Object.keys(SECTION_MAP).join(', ')

/**
 * System prompt fragment that teaches the LLM about available navigation.
 * Used for conversational awareness — the LLM can mention pages/projects
 * naturally, and intent detection handles the actual navigation.
 */
export const TOOL_SYSTEM_PROMPT = `
You can help users navigate this website. Available pages: ${pageNames}. Available projects: ${projectNames}. Available sections: ${sectionNames}.
When a user wants to navigate, tell them you're taking them there. The site will handle the navigation automatically.
`

/**
 * JSON schema for structured tool call output via response_format.
 * Used with WebLLM's grammar-constrained generation for reliable parsing.
 */
export const TOOL_CALL_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['navigate_to_page', 'show_project', 'scroll_to_section', 'none'],
    },
    target: { type: 'string' },
    reply: { type: 'string' },
  },
  required: ['action', 'target', 'reply'],
})

/**
 * System prompt used when generating a structured tool call response.
 */
export const TOOL_CALL_SYSTEM_PROMPT = `You are a navigation assistant. Given the user's message, decide if they want to navigate somewhere on the website.

Available pages: ${pageNames}
Available projects: ${projectNames}
Available sections: ${sectionNames}

Respond with JSON: {"action": "navigate_to_page"|"show_project"|"scroll_to_section"|"none", "target": "<target name>", "reply": "<short friendly message>"}

If the user is NOT asking to navigate, set action to "none" and target to "".`

const NAV_INTENT = /\b(show me|go to|take me|navigate|open|visit|scroll to|see|check out)\b/i

/**
 * Detect navigation intent from user input using keyword matching.
 * This is the primary, most reliable detection method.
 */
export function detectNavIntent(userMessage: string): FunctionCallResult | null {
  const lower = userMessage.toLowerCase()
  if (!NAV_INTENT.test(lower)) return null

  // Check pages
  for (const [pageName, path] of Object.entries(PAGE_MAP)) {
    if (lower.includes(pageName)) {
      return {
        function: 'navigate_to_page',
        args: { page: path },
        displayText: `Navigating to ${pageName}`,
      }
    }
  }

  // Check projects (match slug or common name variants)
  for (const [projectName, path] of Object.entries(PROJECT_MAP)) {
    const nameVariant = projectName.replace(/-/g, '[\\s-]?')
    if (new RegExp(`\\b${nameVariant}\\b`, 'i').test(lower)) {
      return {
        function: 'show_project',
        args: { project: path },
        displayText: `Opening ${projectName} project`,
      }
    }
  }

  // Check sections
  for (const [sectionName, selector] of Object.entries(SECTION_MAP)) {
    const nameVariant = sectionName.replace(/-/g, '[\\s-]?')
    if (new RegExp(`\\b${nameVariant}\\b`, 'i').test(lower)) {
      return {
        function: 'scroll_to_section',
        args: { selector },
        displayText: `Scrolling to ${sectionName}`,
      }
    }
  }

  return null
}

/**
 * Parse a structured JSON tool call from LLM output (used with response_format: json_object).
 */
export function parseJsonToolCall(jsonString: string): FunctionCallResult | null {
  try {
    const parsed = JSON.parse(jsonString)
    if (!parsed.action || parsed.action === 'none') return null

    switch (parsed.action) {
      case 'navigate_to_page': {
        const path = PAGE_MAP[parsed.target]
        if (!path) return null
        return {
          function: 'navigate_to_page',
          args: { page: path },
          displayText: parsed.reply || `Navigating to ${parsed.target}`,
        }
      }
      case 'show_project': {
        const path = PROJECT_MAP[parsed.target]
        if (!path) return null
        return {
          function: 'show_project',
          args: { project: path },
          displayText: parsed.reply || `Opening ${parsed.target}`,
        }
      }
      case 'scroll_to_section': {
        const selector = SECTION_MAP[parsed.target]
        if (!selector) return null
        return {
          function: 'scroll_to_section',
          args: { selector },
          displayText: parsed.reply || `Scrolling to ${parsed.target}`,
        }
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

/**
 * Legacy parser for <function> tags in LLM output. Kept as a fallback
 * for models that still use the old format.
 */
export function parseToolCallFromOutput(
  output: string,
  userMessage: string,
): FunctionCallResult | null {
  // Try structured <function> tag parsing
  const match = output.match(/<function>([\s\S]*?)<\/function>/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1])
      if (parsed.name && parsed.parameters) {
        switch (parsed.name) {
          case 'navigate_to_page': {
            const path = PAGE_MAP[parsed.parameters.page]
            if (path)
              return {
                function: 'navigate_to_page',
                args: { page: path },
                displayText: `Navigating to ${parsed.parameters.page}`,
              }
            break
          }
          case 'show_project': {
            const path = PROJECT_MAP[parsed.parameters.project]
            if (path)
              return {
                function: 'show_project',
                args: { project: path },
                displayText: `Opening ${parsed.parameters.project}`,
              }
            break
          }
          case 'scroll_to_section': {
            const selector = SECTION_MAP[parsed.parameters.section]
            if (selector)
              return {
                function: 'scroll_to_section',
                args: { selector },
                displayText: `Scrolling to ${parsed.parameters.section}`,
              }
            break
          }
        }
      }
    } catch {
      // Fall through to keyword detection
    }
  }

  // Fallback: keyword-based intent detection
  return detectNavIntent(userMessage)
}
