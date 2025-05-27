import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg'
	className?: string
	text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8'
	}

	return (
		<div className={cn('flex items-center justify-center', className)}>
			<div className="flex flex-col items-center gap-2">
				<Loader2 className={cn('animate-spin', sizeClasses[size])} />
				{text && (
					<p className="text-sm text-muted-foreground animate-pulse">
						{text}
					</p>
				)}
			</div>
		</div>
	)
}

/**
 * Full page loading spinner
 */
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
	return (
		<div className="min-h-[50vh] flex items-center justify-center">
			<LoadingSpinner size="lg" text={text} />
		</div>
	)
}

/**
 * Skeleton loader for content
 */
export function SkeletonLoader({ 
	lines = 3, 
	className 
}: { 
	lines?: number; 
	className?: string 
}) {
	return (
		<div className={cn('space-y-3', className)}>
			{Array.from({ length: lines }, (_, i) => (
				<div
					key={i}
					className={cn(
						'h-4 bg-muted rounded-md animate-pulse',
						i === lines - 1 ? 'w-3/4' : 'w-full'
					)}
				/>
			))}
		</div>
	)
} 