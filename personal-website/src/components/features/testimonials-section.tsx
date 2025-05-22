import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
  context: string
  highlight: string
}

const testimonials: Testimonial[] = [
  {
    quote: "Eduard's technical expertise in AI and machine learning is solid, and he demonstrates the ability to translate complex concepts into practical, workable solutions.",
    author: "Industry Colleague",
    role: "Senior AI Engineer",
    company: "Tech Industry",
    context: "Professional Collaboration",
    highlight: "Technical Implementation"
  },
  {
    quote: "Working with Eduard on hackathons has been productive - his strategic thinking and rapid prototyping skills consistently contribute to successful outcomes.",
    author: "Hackathon Teammate",
    role: "Full-Stack Developer",
    company: "Startup Ecosystem",
    context: "Atlantic AI Summit 2025",
    highlight: "Problem Solving"
  },
  {
    quote: "Eduard's workshops on AI implementation are technically sound and well-structured. He explains complex topics clearly and provides practical examples.",
    author: "Workshop Attendee",
    role: "Product Manager",
    company: "Maritime Tech",
    context: "AI Education Workshop",
    highlight: "Technical Communication"
  },
]

export function TestimonialsSection() {
  return (
    <section className='py-12 md:py-24 bg-muted/40 w-full'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl mb-4'>
            Professional Feedback
          </h2>
          <p className='text-muted-foreground md:text-lg max-w-2xl mx-auto'>
            Feedback from colleagues, collaborators, and workshop participants
          </p>
        </div>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className='h-full border-0 shadow-lg bg-background'>
              <CardContent className='p-6 h-full flex flex-col'>
                <div className='flex-1'>
                  <blockquote className='text-sm leading-relaxed text-muted-foreground mb-4 italic'>
                    "{testimonial.quote}"
                  </blockquote>
                </div>
                <div className='space-y-3 pt-4 border-t border-muted'>
                  <div>
                    <p className='font-semibold text-sm'>{testimonial.author}</p>
                    <p className='text-xs text-muted-foreground'>
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='secondary' className='text-xs'>
                      {testimonial.context}
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      {testimonial.highlight}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className='mt-12 text-center'>
          <p className='text-sm text-muted-foreground max-w-xl mx-auto'>
            <strong>Professional References Available:</strong> I can connect you with former colleagues, 
            hackathon teammates, and workshop participants who can speak to my technical skills and work approach.
          </p>
        </div>
      </div>
    </section>
  )
} 