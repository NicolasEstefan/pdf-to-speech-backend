import z from 'zod'

export const configValidationSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DB_HOST: z.string().nonempty(),
  DB_PORT: z.coerce.number(),
  DB_USERNAME: z.string().nonempty(),
  DB_PASSWORD: z.string().nonempty(),
  DB_DATABASE: z.string().nonempty(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().nonempty(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().nonempty(),
  SERVER_URL: z.string().nonempty(),
  ACCESS_TOKEN_SECRET: z.string().nonempty(),
  ACCESS_TOKEN_DURATION: z.string().nonempty(),
  REFRESH_TOKEN_DURATION: z.string().nonempty(),
  FRONTEND_URL: z.string().nonempty(),
  PDFS_PATH: z.string().nonempty(),
  TXTS_PATH: z.string().nonempty(),
  AUDIOS_PATH: z.string().nonempty(),
  OPENAI_API_KEY: z.string().nonempty(),
  LLM_MODEL: z.string().default('gpt-4.1'),
  GCS_BUCKET_NAME: z.string().nonempty(),
  GCLOUD_PROJECT_ID: z.string().nonempty(),
  GCLOUD_TTS_URL: z.string().nonempty(),
  GCLOUD_TTS_PROGRESS_CHECK_URL: z.string().nonempty(),
  TTS_PROGRESS_REPORT_INTERVAL: z.coerce.number().default(5000),
  TTS_MAX_WAIT: z.coerce.number().default(2 * 60 * 60), // 2 hs default
})
