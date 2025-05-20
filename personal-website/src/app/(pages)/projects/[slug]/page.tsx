import { type Project } from '@/components/features/project-card' // Re-using the Project type
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react' // Or any other icon library
import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Sample project data - this should ideally be fetched from a CMS, markdown, or a dedicated data file
// For now, ensure it matches the structure in projects/page.tsx for consistency or refactor to a shared source
const allProjects: Project[] = [
  {
    slug: 'ai-data-analyzer',
    title: 'AI-Powered Data Analyzer',
    description: 'A cutting-edge tool that leverages machine learning to provide deep insights from complex datasets. Features include automated report generation and predictive modeling.',
    longDescription: 'This project involved developing a sophisticated platform for data analysis using Python, TensorFlow, and Scikit-learn. The Next.js frontend provides an intuitive interface for users to upload data, configure analysis parameters, and visualize results. Key challenges included optimizing model performance for large datasets and ensuring data security. We employed techniques like model quantization and distributed training to achieve scalability. The user interface was built with accessibility in mind, adhering to WCAG 2.1 AA standards.',
    imageUrl: '/images/placeholders/project-analyzer.png', 
    tags: ['Python', 'TensorFlow', 'Next.js', 'Machine Learning', 'Data Visualization', 'Scalability', 'Accessibility'],
    liveUrl: '#', 
    repoUrl: '#',
  },
  {
    slug: 'intelligent-chatbot',
    title: 'Intelligent Chatbot Solution',
    description: 'A conversational AI developed to enhance customer support and engagement with natural language processing and understanding capabilities.',
    longDescription: "Built with Dialogflow and integrated into a React-based web application, this chatbot handles customer inquiries, provides information, and can escalate issues to human agents. The project focused on creating natural conversation flows and training the NLU model for high accuracy. Extensive A/B testing was conducted to refine conversational paths and improve user satisfaction. Integration with existing CRM systems was a key feature.",
    imageUrl: '/images/placeholders/project-chatbot.png', 
    tags: ['Dialogflow', 'Node.js', 'React', 'NLP', 'Conversational AI', 'A/B Testing', 'CRM Integration'],
    liveUrl: '#',
  },
  {
    slug: 'e-commerce-recommender',
    title: 'E-commerce Recommendation Engine',
    description: 'A personalized recommendation system for an e-commerce platform to improve user experience and increase sales through tailored suggestions.',
    longDescription: "This system uses collaborative filtering and content-based filtering techniques to generate product recommendations. It was built using Python with libraries like Pandas and Surprise, and integrated with the e-commerce backend via REST APIs. The engine processes millions of user interactions daily to provide real-time suggestions. We also incorporated explainable AI (XAI) features to show users why certain items were recommended.",
    imageUrl: '/images/placeholders/project-recommender.png', 
    tags: ['Python', 'Recommendation Systems', 'E-commerce', 'Data Science', 'REST APIs', 'XAI'],
  },
]

async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  return allProjects.find((project) => project.slug === slug)
}

export async function generateStaticParams() {
  return allProjects.map((project) => ({
    slug: project.slug,
  }))
}

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug)

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: `${project.title} | Project Details`,
    description: project.description,
    // openGraph: { // Optional: Add Open Graph images for social sharing
    //   images: project.imageUrl ? [project.imageUrl] : [],
    // },
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await getProjectBySlug(params.slug)

  if (!project) {
    notFound() // Triggers 404 page
  }

  return (
    <article className='container py-12 md:py-16'>
      <div className='mb-8'>
        <Link
          href='/projects'
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
          legacyBehavior>
          <ArrowLeftIcon className='mr-2 h-4 w-4' />
          Back to Projects
        </Link>
      </div>
      <header className='mb-8 md:mb-12'>
        <h1 className='mb-3 text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl'>
          {project.title}
        </h1>
        <div className='flex flex-wrap gap-2'>
          {project.tags.map((tag) => (
            <Badge key={tag} variant='outline'>
              {tag}
            </Badge>
          ))}
        </div>
      </header>
      {project.imageUrl && (
        <div className='mb-8 aspect-video w-full overflow-hidden rounded-lg md:mb-12'>
          <Image
            src={project.imageUrl}
            alt={project.title}
            width={1200} // Provide appropriate width
            height={675}  // Provide appropriate height (16:9 aspect ratio)
            className='object-cover'
            priority // Prioritize if above the fold
          />
        </div>
      )}
      <div className='prose prose-zinc mx-auto max-w-3xl dark:prose-invert lg:prose-lg xl:prose-xl'>
        {/* Using a simple paragraph for long description. For Markdown, use a library like react-markdown or mdx. */}
        <p>{project.longDescription}</p>
      </div>
      {(project.liveUrl || project.repoUrl) && (
        <div className='mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center'>
          {project.liveUrl && (
            <Button asChild size='lg'>
              <a href={project.liveUrl} target='_blank' rel='noopener noreferrer'>
                View Live Demo
              </a>
            </Button>
          )}
          {project.repoUrl && (
            <Button asChild variant='outline' size='lg'>
              <a href={project.repoUrl} target='_blank' rel='noopener noreferrer'>
                View Code Repository
              </a>
            </Button>
          )}
        </div>
      )}
    </article>
  );
} 