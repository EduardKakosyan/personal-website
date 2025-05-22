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
              As an AI Developer, I focus on building practical AI applications that solve real problems. 
              My work involves developing robust, scalable solutions from initial concept through deployment.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              I recently graduated from Dalhousie University with a Bachelor of Computer Science, where I built a solid foundation in software engineering and machine learning. 
              I actively participate in hackathons, and looking for more hackathons to participate in, especially local ones. 
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              <strong>Current Focus:</strong> Bridging the gap between AI and small/medium businesses. Working on projects that help businesses use AI to their advantage.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              <strong>Knowledge Sharing:</strong> I conduct workshops on AI topics, 
              covering everything from basic concepts to advanced model deployment techniques.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              Outside of work, I enjoy hiking, camping, and photography. 
              These activities help me maintain perspective and often lead to creative problem-solving.
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