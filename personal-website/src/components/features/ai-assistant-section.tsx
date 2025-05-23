import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'

export function AIAssistantSection() {
	return (
		<section className='py-8 bg-black w-full'>
			<div className='container mx-auto px-4 max-w-6xl text-center'>
				<div className='flex items-center justify-center gap-3 mb-4'>
					<MessageCircle className='h-6 w-6 text-primary' />
					<h3 className='text-xl font-semibold text-white'>Try My AI Assistant</h3>
				</div>
				<p className='text-gray-300 mb-4'>
					Have questions about my projects or background? Click the chat button in the bottom-right corner to start a conversation with my on-browser local AI assistant.
				</p>
				<div className='flex justify-center gap-2'>
					<Badge variant='outline' className='border-gray-600 text-gray-300'>Powered by WebLLM</Badge>
					<Badge variant='outline' className='border-gray-600 text-gray-300'>Runs Locally on Your Browser</Badge>
					<Badge variant='outline' className='border-gray-600 text-gray-300'>No Data Sent to Servers</Badge>
					<Badge variant='outline' className='border-gray-600 text-gray-300'>Model: Llama-3.2-1B-Instruct-q4f32_1-MLC</Badge>
				</div>
				<p className='text-xs text-gray-400 mt-2'>
					Requires a WebGPU-compatible browser (Chrome, Edge)
				</p>
			</div>
		</section>
	)
} 