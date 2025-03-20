import { ProjectsList } from "@/components/projects-list";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="container mx-auto flex max-w-screen-xl flex-col items-start gap-4 text-left">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
          My Projects
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground">
          A showcase of my recent projects and the technologies used to build
          them.
        </p>
      </div>

      <div className="container mx-auto max-w-screen-xl mt-8">
        <ProjectsList />
      </div>
    </div>
  );
}
