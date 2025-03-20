"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { ExternalLinkIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProjectLanguage {
  id: number;
  name: string;
  author: string;
  languages: string[];
  description: string;
  liveUrl?: string;
  githubUrl?: string;
  inProgress?: boolean;
}

export function ProjectsList() {
  const [projects, setProjects] = useState<ProjectLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5175/api/projects");

        if (response.data.status === "success") {
          setProjects(response.data.data);
        } else {
          setError("Failed to fetch projects");
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("An error occurred while fetching projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 border border-red-300 bg-red-50 text-red-700 rounded">
        <p>{error}</p>
        <p className="text-sm mt-2">Please make sure the server is running.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {project.name}
              {project.inProgress && (
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500 font-medium">
                  In Progress
                </span>
              )}
            </CardTitle>
            <CardDescription>{project.author}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {project.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
                >
                  {language}
                </span>
              ))}
            </div>
            {(project.liveUrl || project.githubUrl) && (
              <div className="flex gap-3 w-full">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    title="Live Demo"
                  >
                    <ExternalLinkIcon className="h-5 w-5" />
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    title="View on GitHub"
                  >
                    <GitHubLogoIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
