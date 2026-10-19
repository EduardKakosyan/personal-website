import { chapters, type ChapterId } from '@/content/story'

export function StageStill({ current }: { current: ChapterId }) {
  return (
    <div className="story-stills">
      {chapters.map((chapter) => (
        <picture key={chapter.id} data-active={chapter.id === current}>
          <source media="(prefers-color-scheme: dark)" srcSet={chapter.still.dark} />
          {/* Optimized captures; picture selects the OS theme before hydration. */}
          <img
            src={chapter.still.light}
            alt={chapter.id === current ? chapter.still.alt : ''}
            width={800}
            height={700}
            decoding="async"
            loading="lazy"
            fetchPriority="low"
          />
        </picture>
      ))}
    </div>
  )
}
