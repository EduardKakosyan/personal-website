export interface ModelTier {
  id: string
  label: string
  description: string
  modelId: string
}
export const MODEL_TIERS: ModelTier[] = [
  {
    id: 'fast',
    label: 'Light',
    description: 'Smallest download · suitable for constrained devices',
    modelId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'More capable · larger download',
    modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  },
  {
    id: 'quality',
    label: 'Quality',
    description: 'Largest download · requires more GPU memory',
    modelId: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC',
  },
]
