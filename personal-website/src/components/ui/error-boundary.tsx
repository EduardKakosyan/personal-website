'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
	children: ReactNode
	fallback?: ReactNode
	onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
	hasError: boolean
	error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo)
		
		// Call optional error handler
		this.props.onError?.(error, errorInfo)
		
		// Report to error tracking service in production
		if (process.env.NODE_ENV === 'production') {
			// TODO: Integrate with error tracking service (Sentry, etc.)
			console.error('Production error:', { error, errorInfo })
		}
	}

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback
			}

			// Default error UI
			return (
				<Card className="w-full max-w-md mx-auto mt-8">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
							<AlertTriangle className="h-6 w-6 text-destructive" />
						</div>
						<CardTitle className="text-xl">Something went wrong</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-muted-foreground">
							We encountered an unexpected error. Please try refreshing the page.
						</p>
						{process.env.NODE_ENV === 'development' && this.state.error && (
							<details className="text-left">
								<summary className="cursor-pointer text-sm font-medium">
									Error Details (Development)
								</summary>
								<pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
									{this.state.error.stack}
								</pre>
							</details>
						)}
						<Button
							onClick={() => {
								this.setState({ hasError: false, error: undefined })
								window.location.reload()
							}}
							className="w-full"
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Reload Page
						</Button>
					</CardContent>
				</Card>
			)
		}

		return this.props.children
	}
}

/**
 * Hook-based error boundary for functional components
 */
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	fallback?: ReactNode
) {
	return function WrappedComponent(props: P) {
		return (
			<ErrorBoundary fallback={fallback}>
				<Component {...props} />
			</ErrorBoundary>
		)
	}
} 