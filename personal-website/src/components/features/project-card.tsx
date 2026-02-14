import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type Project } from '@/content/projects'

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {project.imageUrl && (
        <div className="relative h-48 w-full flex-shrink-0">
          <Image src={project.imageUrl} alt={project.title} fill className="object-cover" />
        </div>
      )}
      <CardHeader className="flex-shrink-0">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2">{project.title}</CardTitle>
          {project.placement && (
            <Badge variant="destructive" className="w-fit">
              {project.placement}
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-3 min-h-[4.5rem]">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="mb-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0 gap-2 flex-wrap">
        <Button asChild size="sm" className="flex-1 basis-full sm:basis-auto">
          <Link href={`/projects/${project.slug}`}>View Details</Link>
        </Button>
        {project.liveUrl && (
          <Button asChild variant="outline" size="sm" className="flex-1 min-w-0">
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              Live Demo
            </a>
          </Button>
        )}
        {project.repoUrl && (
          <Button asChild variant="outline" size="sm" className="flex-1 min-w-0">
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              View Code
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
