import { ProjectCard, type Project } from '@/components/features/project-card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Projects | AI Developer',
  description: 'Explore a collection of AI and web development projects I have worked on.',
}

// Sample project data - replace with actual data fetching or import from a data file later
const allProjects: Project[] = [
  {
    slug: 'ai-data-analyzer',
    title: 'AI-Powered Data Analyzer',
    description: 'A cutting-edge tool that leverages machine learning to provide deep insights from complex datasets. Features include automated report generation and predictive modeling.',
    longDescription: 'This project involved developing a sophisticated platform for data analysis using Python, TensorFlow, and Scikit-learn. The Next.js frontend provides an intuitive interface for users to upload data, configure analysis parameters, and visualize results. Key challenges included optimizing model performance for large datasets and ensuring data security.',
    imageUrl: '/images/placeholders/project-analyzer.png', // Replace with actual image path
    tags: ['Python', 'TensorFlow', 'Next.js', 'Machine Learning', 'Data Visualization'],
    liveUrl: '#', // Replace with actual live URL if available
    repoUrl: '#', // Replace with actual repo URL
  },
  {
    slug: 'intelligent-chatbot',
    title: 'Intelligent Chatbot Solution',
    description: 'A conversational AI developed to enhance customer support and engagement with natural language processing and understanding capabilities.',
    longDescription: "Built with Dialogflow and integrated into a React-based web application, this chatbot handles customer inquiries, provides information, and can escalate issues to human agents. The project focused on creating natural conversation flows and training the NLU model for high accuracy.",
    imageUrl: '/images/placeholders/project-chatbot.png', // Replace with actual image path
    tags: ['Dialogflow', 'Node.js', 'React', 'NLP', 'Conversational AI'],
    liveUrl: '#',
  },
  {
    slug: 'e-commerce-recommender',
    title: 'E-commerce Recommendation Engine',
    description: 'A personalized recommendation system for an e-commerce platform to improve user experience and increase sales through tailored suggestions.',
    longDescription: "This system uses collaborative filtering and content-based filtering techniques to generate product recommendations. It was built using Python with libraries like Pandas and Surprise, and integrated with the e-commerce backend.",
    imageUrl: '/images/placeholders/project-recommender.png', // Replace with actual image path
    tags: ['Python', 'Recommendation Systems', 'E-commerce', 'Data Science'],
  },
  // Add more projects as needed
]

export default function ProjectsPage() {
  return (
    <div className='container py-12 md:py-16'>
      <div className='mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl'>
          My Portfolio
        </h1>
        <p className='mt-3 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl'>
          Here are some of the projects I&apos;ve passionately worked on, showcasing my skills in AI and software development.
        </p>
      </div>

      {allProjects.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8'>
          {allProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className='text-center text-muted-foreground'>
          No projects to display at the moment. Please check back soon!
        </p>
      )}
    </div>
  )
} 