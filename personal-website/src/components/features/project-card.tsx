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
    <Card className='flex h-full flex-col'>
      <CardHeader>
        {project.imageUrl && (
          <div className='relative mb-4 h-48 w-full'>
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              className='rounded-t-lg object-cover'
            />
          </div>
        )}
        <CardTitle>{project.title}</CardTitle>
        {project.placement && (
          <div className="mt-2 mb-2">
            <Badge variant="destructive">{project.placement}</Badge>
          </div>
        )}
        <CardDescription className='line-clamp-3'>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className='flex-grow'>
        <div className='mb-4 flex flex-wrap gap-2'>
          {project.tags.map((tag) => (
            <Badge key={tag} variant='secondary'>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className='flex justify-start gap-2'>
        <Button asChild>
          <Link href={`/projects/${project.slug}`}>View Details</Link>
        </Button>
        {project.liveUrl && (
          <Button asChild variant='outline'>
            <a href={project.liveUrl} target='_blank' rel='noopener noreferrer'>
              Live Demo
            </a>
          </Button>
        )}
        {project.repoUrl && (
          <Button asChild variant='outline'>
            <a href={project.repoUrl} target='_blank' rel='noopener noreferrer'>
              View Code
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 