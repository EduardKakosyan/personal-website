import { profile } from '@/content/profile'
import { ResumeLink } from '@/components/features/about/resume-link'

export function StoryHero() {
  return (
    <header className="story-hero site-width">
      <h1>
        I’m Eduard, a <em>Forward Deployed AI Developer</em> based in Halifax.
      </h1>
      <p className="site-lead">{profile.headline}</p>
      <div className="story-actions">
        <a className="site-button" href="#selected-work">
          See the work
        </a>
        <ResumeLink />
      </div>
    </header>
  )
}
