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
             My name is Eduard Kakosyan, I am a recent graduate of Dalhousie University, where I studied Bachelor of Computer Science. I have a passion for building AI applications and driving technological advancements.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
             I also love competing in hackathons, and I have won a few of them. If you have any hackathon ideas, I am all ears. 
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              In addition to my love of technology, I also love all things nature and photography. I love hiking, camping, and fishing.
            </p>
            <p className='text-muted-foreground md:text-lg/relaxed'>
              If you have any questions, feel free to reach out to me. I am always looking to learn and grow.
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