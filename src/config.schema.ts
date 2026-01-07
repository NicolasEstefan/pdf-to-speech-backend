import z from 'zod'

export const configValidationSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DB_HOST: z.string().nonempty(),
  DB_PORT: z.string().nonempty(),
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
  OPENAI_API_KEY: z.string().nonempty(),
  LLM_MODEL: z.string().default('gpt-4.1'),
})
