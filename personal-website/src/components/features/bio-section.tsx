import Image from 'next/image' // Assuming an image might be used here

export function BioSection() {
  return (
    <section className='py-12 md:py-24'>
      <div className='container'>
        <div className='grid items-center gap-8 lg:grid-cols-2 lg:gap-12'>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl'>
              My Journey into AI
            </h2>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              From a young age, I was captivated by the potential of technology to solve complex problems. My journey into Artificial Intelligence began during my studies at [University Name], where I discovered a passion for machine learning and data science. I was particularly drawn to [Specific Area of AI, e.g., Natural Language Processing, Computer Vision] because [Reason].
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              Living in Halifax, Nova Scotia, a growing tech hub, has provided me with unique opportunities to collaborate on innovative projects. I believe in a human-centric approach to AI, focusing on creating solutions that are not only technologically advanced but also ethical, transparent, and beneficial to society.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              My philosophy is to continuously learn and adapt in this rapidly evolving field, always striving to push the boundaries of what AI can achieve while ensuring its responsible application.
            </p>
          </div>
          <div className='flex justify-center'>
            {/* Placeholder for a professional image or relevant graphic */}
            {/* <Image src="/placeholder-profile.jpg" alt="AI Developer - [Your Name]" width={400} height={400} className="rounded-lg object-cover aspect-square" /> */}
            <div className='w-full max-w-md h-80 rounded-lg bg-muted flex items-center justify-center text-muted-foreground'>
              [Placeholder for Profile Image]
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 