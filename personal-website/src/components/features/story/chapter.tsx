import { type Chapter as StoryChapter } from '@/content/story'
import { storyCopy } from '@/content/story-copy'
import { projects } from '@/content/projects'
import { profile } from '@/content/profile'
import { ResumeLink } from '@/components/features/about/resume-link'

export function Chapter({ chapter }: { chapter: StoryChapter }) {
  return (
    <section id={chapter.id} className="story-chapter" aria-labelledby={`${chapter.id}-heading`}>
      <p className="site-kicker">{chapter.id.replace('-', ' / ')}</p>
      <h2 id={`${chapter.id}-heading`}>{chapter.headline}</h2>
      <p>{storyCopy(chapter.line)}</p>
      <ul className="story-chips">
        {chapter.proof.map((slug) => {
          const project = projects.find((item) => item.slug === slug)
          const client = profile.clientWork.find((item) => item.slug === slug)
          return (
            <li key={slug}>
              <a href={project ? `/projects/${slug}` : client!.url}>
                {project?.title ?? client!.title}
              </a>
            </li>
          )
        })}
      </ul>
      <a className="work-link" href={chapter.learnMore}>
        Learn more{' '}
        <span className="sr-only">
          about{' '}
          {chapter.id === 'next-step'
            ? 'getting in touch'
            : chapter.id === 'adoption'
              ? 'the experience'
              : chapter.id === 'systems'
                ? 'Keystone'
                : 'Keeper'}
        </span>{' '}
        &rarr;
      </a>
      {chapter.id === 'next-step' && (
        <div id="about" className="story-actions">
          <ResumeLink />
          <a className="site-button" href="/contact">
            Contact
          </a>
        </div>
      )}
    </section>
  )
}
