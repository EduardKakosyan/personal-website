import { WeatherWidget } from "@/components/weather-widget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-20">
        <div className="container mx-auto flex max-w-screen-xl flex-col items-start gap-4 text-left">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1] pl-4">
            Hello, I&apos;m Eduard Kakosyan
          </h1>

          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            I am an AI developer currently working on my own startup called{" "}
            <a
              href="https://cargrep.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent hover:underline"
            >
              cargrep.com
            </a>
            . Additionally, I am helping other companies with automation
            workflows.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="container mx-auto flex max-w-screen-xl flex-col gap-8 md:flex-row">
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
                <CardDescription>
                  AI Developer with focus on Cybersecurity and Automation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  I specialize in building AI agents that help businesses
                  automate their workflows. I work with agentic tools like
                  Responses API, Vercel AI SDK, LangGraph, and more.
                  Additionally, I have my own homelab environment where I tinker
                  with different IT technologies. I am also interested in
                  cybersecurity and privacy.
                </p>
                <p>
                  I have also co-founded my own startup called cargrep.com,
                  partnered with ShiftKey Build.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:w-[350px] lg:w-[400px]">
            <WeatherWidget />
          </div>
        </div>
      </section>
    </div>
  );
}
