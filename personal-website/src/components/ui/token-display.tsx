'use client'

import { useState } from 'react'
import { 
	formatTokenCount, 
	formatCost, 
	TokenAnalysis,
	TokenSession,
	MODEL_CONFIGS,
	ModelName 
} from '@/lib/token-utils'
import { Button } from '@/components/ui/button'
import { 
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@/components/ui/tooltip'
import { 
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { 
	Activity, 
	BarChart3, 
	Clock, 
	DollarSign, 
	Hash, 
	Info, 
	MessageSquare, 
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	Download,
	Upload,
	RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TokenDisplayProps {
	currentTokens: number
	analysis: TokenAnalysis
	session: TokenSession
	conversationTokens: number
	warningLevel: 'safe' | 'warning' | 'danger'
	remainingContext: number
	modelName?: ModelName
	compact?: boolean
	showDetails?: boolean
	onExport?: () => void
	onImport?: (data: string) => void
	onReset?: () => void
}

export function TokenDisplay({
	currentTokens,
	analysis,
	session,
	conversationTokens,
	warningLevel,
	remainingContext,
	modelName = 'llama3.2',
	compact = false,
	showDetails = true,
	onExport,
	onImport,
	onReset
}: TokenDisplayProps) {
	const [view, setView] = useState<'current' | 'session' | 'analysis'>('current')
	const [showAdvanced, setShowAdvanced] = useState(false)

	const config = MODEL_CONFIGS[modelName]
	const contextUsagePercent = ((conversationTokens + currentTokens) / config.maxTokens) * 100

	// Warning level styling
	const getWarningStyles = (level: 'safe' | 'warning' | 'danger') => {
		switch (level) {
			case 'safe':
				return 'text-green-600 dark:text-green-400'
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400'
			case 'danger':
				return 'text-red-600 dark:text-red-400'
		}
	}

	const getWarningIcon = (level: 'safe' | 'warning' | 'danger') => {
		switch (level) {
			case 'safe':
				return <CheckCircle className="h-3 w-3" />
			case 'warning':
			case 'danger':
				return <AlertTriangle className="h-3 w-3" />
		}
	}

	// Session duration
	const sessionDuration = new Date().getTime() - session.startTime.getTime()
	const sessionMinutes = Math.floor(sessionDuration / (1000 * 60))

	// Handle file import
	const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file || !onImport) return

		const reader = new FileReader()
		reader.onload = (e) => {
			const content = e.target?.result as string
			onImport(content)
		}
		reader.readAsText(file)
		
		// Reset input
		event.target.value = ''
	}

	if (compact) {
		return (
			<TooltipProvider>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<Tooltip>
						<TooltipTrigger asChild>
							<div className={cn("flex items-center gap-1", getWarningStyles(warningLevel))}>
								{getWarningIcon(warningLevel)}
								<span>{formatTokenCount(currentTokens)}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<div className="space-y-1 text-xs">
								<div>Current input: {formatTokenCount(currentTokens)} tokens</div>
								<div>Conversation: {formatTokenCount(conversationTokens)} tokens</div>
								<div>Remaining: {formatTokenCount(remainingContext)} tokens</div>
							</div>
						</TooltipContent>
					</Tooltip>
					
					{showDetails && (
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="sm" className="h-auto p-1">
									<Info className="h-3 w-3" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80" align="end">
								<TokenDisplay
									{...{
										currentTokens,
										analysis,
										session,
										conversationTokens,
										warningLevel,
										remainingContext,
										modelName,
										compact: false,
										showDetails: false,
										onExport,
										onImport,
										onReset
									}}
								/>
							</PopoverContent>
						</Popover>
					)}
				</div>
			</TooltipProvider>
		)
	}

	return (
		<div className="space-y-3">
			{/* View Selector */}
			<div className="flex items-center gap-1">
				<Button
					variant={view === 'current' ? 'default' : 'ghost'}
					size="sm"
					onClick={() => setView('current')}
					className="h-7 px-2 text-xs"
				>
					<Hash className="h-3 w-3 mr-1" />
					Current
				</Button>
				<Button
					variant={view === 'session' ? 'default' : 'ghost'}
					size="sm"
					onClick={() => setView('session')}
					className="h-7 px-2 text-xs"
				>
					<Activity className="h-3 w-3 mr-1" />
					Session
				</Button>
				<Button
					variant={view === 'analysis' ? 'default' : 'ghost'}
					size="sm"
					onClick={() => setView('analysis')}
					className="h-7 px-2 text-xs"
				>
					<BarChart3 className="h-3 w-3 mr-1" />
					Analysis
				</Button>
			</div>

			{/* Current View */}
			{view === 'current' && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium">Input Tokens</span>
						<span className={cn("text-xs font-mono", getWarningStyles(warningLevel))}>
							{formatTokenCount(currentTokens)}
						</span>
					</div>
					
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">Conversation</span>
						<span className="text-xs font-mono">{formatTokenCount(conversationTokens)}</span>
					</div>
					
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">Remaining</span>
						<span className={cn("text-xs font-mono", getWarningStyles(warningLevel))}>
							{formatTokenCount(remainingContext)}
						</span>
					</div>

					{/* Context Usage Bar */}
					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Context Usage</span>
							<span className={getWarningStyles(warningLevel)}>
								{contextUsagePercent.toFixed(1)}%
							</span>
						</div>
						<div className="h-1.5 bg-muted rounded-full overflow-hidden">
							<div 
								className={cn(
									"h-full transition-all duration-300",
									warningLevel === 'safe' && "bg-green-500",
									warningLevel === 'warning' && "bg-yellow-500",
									warningLevel === 'danger' && "bg-red-500"
								)}
								style={{ width: `${Math.min(contextUsagePercent, 100)}%` }}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Session View */}
			{view === 'session' && (
				<div className="space-y-2">
					<div className="grid grid-cols-2 gap-2 text-xs">
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-muted-foreground">
								<TrendingUp className="h-3 w-3" />
								Input
							</div>
							<div className="font-mono">{formatTokenCount(session.inputTokens)}</div>
						</div>
						
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-muted-foreground">
								<TrendingUp className="h-3 w-3" />
								Output
							</div>
							<div className="font-mono">{formatTokenCount(session.outputTokens)}</div>
						</div>
						
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-muted-foreground">
								<MessageSquare className="h-3 w-3" />
								Messages
							</div>
							<div className="font-mono">{session.messageCount}</div>
						</div>
						
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-muted-foreground">
								<Clock className="h-3 w-3" />
								Duration
							</div>
							<div className="font-mono">{sessionMinutes}m</div>
						</div>
					</div>

					<div className="flex items-center justify-between pt-1 border-t">
						<span className="text-xs text-muted-foreground">Total Tokens</span>
						<span className="text-xs font-mono font-medium">
							{formatTokenCount(session.totalTokens)}
						</span>
					</div>

					{session.estimatedCost > 0 && (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<DollarSign className="h-3 w-3" />
								Est. Cost
							</div>
							<span className="text-xs font-mono">{formatCost(session.estimatedCost)}</span>
						</div>
					)}
				</div>
			)}

			{/* Analysis View */}
			{view === 'analysis' && (
				<div className="space-y-2">
					<div className="grid grid-cols-2 gap-2 text-xs">
						<div>
							<div className="text-muted-foreground">Words</div>
							<div className="font-mono">{analysis.words}</div>
						</div>
						<div>
							<div className="text-muted-foreground">Characters</div>
							<div className="font-mono">{analysis.characters}</div>
						</div>
						<div>
							<div className="text-muted-foreground">Tokens/Word</div>
							<div className="font-mono">{analysis.avgTokensPerWord.toFixed(2)}</div>
						</div>
						<div>
							<div className="text-muted-foreground">Efficiency</div>
							<div className="font-mono">{(analysis.efficiency * 100).toFixed(1)}%</div>
						</div>
					</div>

					<div className="flex items-center justify-between pt-1 border-t">
						<span className="text-xs text-muted-foreground">Complexity</span>
						<span className={cn(
							"text-xs font-medium capitalize",
							analysis.complexity === 'low' && "text-green-600 dark:text-green-400",
							analysis.complexity === 'medium' && "text-yellow-600 dark:text-yellow-400",
							analysis.complexity === 'high' && "text-red-600 dark:text-red-400"
						)}>
							{analysis.complexity}
						</span>
					</div>
				</div>
			)}

			{/* Advanced Tools */}
			{showDetails && (
				<div className="pt-2 border-t">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowAdvanced(!showAdvanced)}
						className="h-6 px-2 text-xs w-full justify-center"
					>
						{showAdvanced ? 'Hide' : 'Show'} Tools
					</Button>

					{showAdvanced && (
						<div className="mt-2 flex items-center gap-1">
							{onExport && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												onClick={onExport}
												className="h-6 w-6 p-0"
											>
												<Download className="h-3 w-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Export session data</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}

							{onImport && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<label className="cursor-pointer">
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													asChild
												>
													<span>
														<Upload className="h-3 w-3" />
													</span>
												</Button>
												<input
													type="file"
													accept=".json"
													onChange={handleFileImport}
													className="hidden"
												/>
											</label>
										</TooltipTrigger>
										<TooltipContent>Import session data</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}

							{onReset && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												onClick={onReset}
												className="h-6 w-6 p-0"
											>
												<RotateCcw className="h-3 w-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Reset session</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
} 