import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg'
	text?: string
	className?: string
}

export function LoadingSpinner({ 
	size = 'md', 
	text, 
	className 
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8'
	}

	const textSizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	}

	return (
		<div className={cn('flex items-center justify-center gap-2', className)}>
			<div className='relative'>
				{/* Main spinner */}
				<div
					className={cn(
						'animate-spin rounded-full border-2 border-transparent',
						'border-t-primary border-r-primary/30',
						sizeClasses[size]
					)}
					style={{
						animationDuration: '1s',
						animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
					}}
				/>
				
				{/* Secondary ring for depth */}
				<div
					className={cn(
						'absolute inset-0 animate-spin rounded-full border border-transparent',
						'border-b-primary/20 border-l-primary/20',
						sizeClasses[size]
					)}
					style={{
						animationDuration: '1.5s',
						animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
						animationDirection: 'reverse'
					}}
				/>
			</div>
			
			{text && (
				<span className={cn(
					'text-muted-foreground font-medium animate-pulse',
					textSizeClasses[size]
				)}>
					{text}
				</span>
			)}
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
	className,
	...props 
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'animate-pulse rounded-md bg-muted/50',
				className
			)}
			{...props}
		/>
	)
}

// Mobile-optimized pulse animation
export function PulseLoader({ 
	count = 3,
	size = 'md',
	className 
}: {
	count?: number
	size?: 'sm' | 'md' | 'lg'
	className?: string
}) {
	const sizeClasses = {
		sm: 'h-2 w-2',
		md: 'h-3 w-3',
		lg: 'h-4 w-4'
	}

	return (
		<div className={cn('flex items-center justify-center gap-1', className)}>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className={cn(
						'rounded-full bg-primary animate-bounce',
						sizeClasses[size]
					)}
					style={{
						animationDelay: `${i * 0.15}s`,
						animationDuration: '0.6s'
					}}
				/>
			))}
		</div>
	)
} 