import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="container mx-auto flex max-w-screen-xl flex-col items-start gap-4 text-left">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
          About Me
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground">
          Learn more about my background, experience, and interests.
        </p>
      </div>

      <div className="container mx-auto max-w-screen-xl mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Bachelor of Computer Science</h3>
              <p className="text-sm text-muted-foreground">
                Dalhousie University, 2021-2025
              </p>
              <p className="mt-2">
                Focused on AI and Cybersecurity. Have earned a Cybersecurity
                certificate from Dalhousie. Currently pursuing CompTIA Security+
                and AWS SAA certifications.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium">Co-Founder - ShiftKey Build</h3>
              <p className="text-sm text-muted-foreground">
                CarGrep |{" "}
                <a
                  href="https://cargrep.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  cargrep.com
                </a>
                , Halifax, NS, Canada, October 2024 – Present
              </p>
            </div>

            <div>
              <h3 className="font-medium">
                Software Developer (Co-op) - Data Science
              </h3>
              <p className="text-sm text-muted-foreground">
                Rayleigh Solar Tech, Dartmouth, NS, January 2024 – August 2024
              </p>
            </div>

            <div>
              <h3 className="font-medium">IT Specialist (Co-op)</h3>
              <p className="text-sm text-muted-foreground">
                IMP Group Aerospace Ltd., Enfield, NS, May 2023 – August 2023
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
