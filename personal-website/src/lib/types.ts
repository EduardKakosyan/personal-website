// Define shared TypeScript interfaces and types here

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  repoUrl?: string;
  tags?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string; // or MDXContent if using a specific type
} 