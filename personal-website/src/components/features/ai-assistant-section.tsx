import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'

export function AIAssistantSection() {
	return (
		<section className='py-8 bg-secondary/20 w-full' data-ai-assistant>
			<div className='container mx-auto px-4 max-w-6xl text-center'>
				<div className='flex items-center justify-center gap-3 mb-4'>
					<MessageCircle className='h-6 w-6 text-primary' />
					<h3 className='text-xl font-semibold'>Try My AI Assistant</h3>
				</div>
				<p className='text-muted-foreground mb-4'>
					Have questions about my projects or background? Try my local browser-hosted AI assistant.
				</p>
				<div className='flex flex-wrap justify-center gap-2 max-w-4xl mx-auto'>
					<Badge variant='outline'>Powered by WebLLM</Badge>
					<Badge variant='outline'>Runs Locally on Your Browser</Badge>
					<Badge variant='outline' className='hidden sm:flex'>No Data Sent to Servers</Badge>
					<Badge variant='outline' className='sm:hidden'>Privacy First</Badge>
					<Badge variant='outline' className='break-all text-center max-w-full'>
						<span className='hidden sm:inline'>Model: Llama-3.2-1B-Instruct-q4f32_1-MLC</span>
						<span className='sm:hidden'>Llama-3.2-1B</span>
					</Badge>
				</div>
				<p className='text-xs text-muted-foreground mt-2 px-4'>
					Requires a WebGPU-compatible browser (Chromium, Edge)
				</p>
			</div>
		</section>
	)
} 