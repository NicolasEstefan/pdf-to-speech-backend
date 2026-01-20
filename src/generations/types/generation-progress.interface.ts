import { GenerationStatus } from './generation-status.enum'

export interface GenerationProgress {
  createdById: string
  generationId: string
  generationStatus: GenerationStatus
  progressPercentage: number
  audioSize?: number
}
