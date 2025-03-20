import { SkillsList } from "@/components/skills-list";

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <div className="container mx-auto flex max-w-screen-xl flex-col items-start gap-4 text-left">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
          My Skills
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground">
          A comprehensive list of my technical skills and competencies.{" "}
        </p>
      </div>

      <div className="container mx-auto max-w-screen-xl mt-8">
        <SkillsList />
      </div>
    </div>
  );
}
