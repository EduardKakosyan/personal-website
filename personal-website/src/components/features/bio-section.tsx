import Image from 'next/image' // Assuming an image might be used here

export function BioSection() {
  return (
    <section className='py-12 md:py-24 w-full'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='grid items-center gap-8 lg:grid-cols-2 lg:gap-12'>
          <div className='space-y-4'>
            <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl'>
              About Me
            </h2>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              I'm an AI developer who loves building stuff and learning new things. 
              I'm currently working on a project that helps small and medium businesses figure out how to actually use the new tech.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              Just graduated from Dalhousie University with a computer science degree. 
              I'm always on the lookout for hackathons to join, especially local ones - there's something fun about the energy and time crunch.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              When I'm not coding, I'm usually hiking, camping, or taking photos. 
              Getting outside helps clear my head and honestly leads to some of my best ideas.
            </p>
          </div>
          <div className='flex justify-center'>
            <div className='w-full max-w-md h-80 rounded-lg bg-muted flex items-center justify-center text-muted-foreground'>
              <Image src='/images/profile.jpeg' alt='Profile' width={400} height={400} className='rounded-lg object-cover aspect-square' />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 