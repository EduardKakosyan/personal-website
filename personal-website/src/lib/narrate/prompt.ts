import { chapters, narratorLines, type Persona } from '../../content/story'
import { storyCopy } from '../../content/story-copy'
import { profile } from '../../content/profile'
import {
  allowsGuideNavigation,
  guideOutputSchemaForQuery,
  guideSections,
  portfolioContext,
  portfolioWorks,
  retrieveWork,
} from '../../content/portfolio'
import type { NarrateInput } from './input-schema'

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}
export interface NarratePrompt {
  messages: ChatMessage[]
  schema: string // JSON schema the model's output must follow
  maxTokens: number
  grounding: string // every fact the model was given; replies may not add numbers beyond it
}

const audience: Record<Persona, string> = {
  recruiter: 'a recruiter checking his role, scope and dates',
  'hiring-manager': 'a hiring manager with a revenue or operations problem to solve',
  engineer: 'an engineer who wants to see how the systems actually work',
}

const month = (value?: string) => value ?? 'present'

// The facts the model may use: the chapter, the line already shown, his roles and the
// relevant project notes. Nothing else from the site is sent.
function notesFor(input: NarrateInput): string {
  const chapter = chapters.find((item) => item.id === input.chapter)!
  const slugs = new Set(chapter.proof)
  if (input.kind === 'question') for (const work of retrieveWork(input.text)) slugs.add(work.slug)
  const works = portfolioWorks.filter((work) => slugs.has(work.slug)).slice(0, 5)
  const clientWork = profile.clientWork.filter((work) => slugs.has(work.slug))
  return [
    `Chapter on screen: "${chapter.headline}" ${storyCopy(chapter.line)}`,
    `Line EK-01 already said: ${narratorLines[input.persona][input.chapter]}`,
    ...profile.roles.map(
      (role) =>
        `Role: ${role.title}, ${role.org} (${role.start} to ${month(role.end)}). ${role.summary}`,
    ),
    ...works.map((work) => `Project ${work.title} [${work.slug}]: ${work.summary} ${work.detail}`),
    ...clientWork.map(
      (work) =>
        `Client work: ${work.title} (${work.role === 'managed' ? 'project lead' : 'team contributor'}).`,
    ),
  ].join('\n')
}

export function buildPrompt(input: NarrateInput): NarratePrompt {
  const notes = notesFor(input)
  const visitor = `The visitor is ${audience[input.persona]}.`
  if (input.kind === 'bridge') {
    return {
      messages: [
        {
          role: 'system',
          content: `${portfolioContext}\n${visitor} They are reading the chapter below, and EK-01's scripted line was already shown. Add one or two short sentences (under 45 words) that the scripted line does not already say, connecting this chapter to what this visitor cares about. Do not repeat the scripted line or greet the visitor. Use only the notes. Never use a number that is not in the notes. Return JSON with action="answer", target="" and your sentences in reply.\nNotes:\n${notes}`,
        },
        { role: 'user', content: 'Write the follow-on line.' },
      ],
      schema: guideOutputSchemaForQuery(''),
      maxTokens: 120,
      grounding: `${portfolioContext}\n${notes}`,
    }
  }
  const navigation = allowsGuideNavigation(input.text)
    ? `Return JSON with action, target and reply. To open a project use action="open_project" with one of: ${portfolioWorks.map((work) => work.slug).join(', ')}. To point at a section use action="highlight_section" with one of: ${Object.keys(guideSections).join(', ')}. Otherwise use action="answer" and target="".`
    : 'Return JSON with action="answer", target="" and your answer in reply.'
  return {
    messages: [
      {
        role: 'system',
        content: `${portfolioContext}\n${visitor} Answer in two or three sentences using only the notes. Never use a number that is not in the notes. If the notes do not cover the question, say so briefly. ${navigation}\nNotes:\n${notes}`,
      },
      { role: 'user', content: input.text },
    ],
    schema: guideOutputSchemaForQuery(input.text),
    maxTokens: 300,
    grounding: `${portfolioContext}\n${notes}`,
  }
}
