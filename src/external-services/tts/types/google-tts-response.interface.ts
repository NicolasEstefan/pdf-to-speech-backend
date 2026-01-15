export interface GoogleTtsResponse {
  name: string
  metadata: {
    progressPercentage: number
  }
  error?: object
}
