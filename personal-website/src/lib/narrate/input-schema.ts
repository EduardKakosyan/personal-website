import { z } from 'zod'
import { chapters, personaOrder, type ChapterId, type Persona } from '../../content/story'

// Relative imports keep this loadable by the Node tests without a bundler.
const personas = Object.keys(personaOrder) as [Persona, ...Persona[]]
const chapterIds = chapters.map((chapter) => chapter.id) as [ChapterId, ...ChapterId[]]

export const narrateInputSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('bridge'), persona: z.enum(personas), chapter: z.enum(chapterIds) })
    .strict(),
  z
    .object({
      kind: z.literal('question'),
      persona: z.enum(personas),
      chapter: z.enum(chapterIds),
      text: z.string().trim().min(1).max(500),
    })
    .strict(),
])
export type NarrateInput = z.infer<typeof narrateInputSchema>
