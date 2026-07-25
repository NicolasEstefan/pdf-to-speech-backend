<h1 align="center">PDF2Speech</h1>

<p align="center">A NestJS backend that converts PDF documents into high-quality audio.</p>

## Description

This is the backend for PDF2Speech, a system that turns PDF documents into audiobooks. It was built to apply and deepen knowledge of NestJS and React + Redux (see the [frontend repo](https://github.com/NicolasEstefan/pdf-to-speech-frontend)), and along the way to get hands-on experience with Google Cloud services: OAuth Consent Screen, Text-to-Speech API, and Cloud Storage.

## Features

- English and Spanish text support
- Handles very large documents, generating audios of 4+ hours
- Over 30 voices to choose from
- Supports scanned PDFs (OCR)
- Google login
- Real-time progress reporting over WebSockets

## How it works

Audio generation is broken down into three phases, orchestrated as a dependency graph of BullMQ jobs, maximizing concurrency to minimize processing time.

### 1. OCR and text extraction

The PDF is run through OCR to digitize any scanned text, using `ocrmypdf` in the server's runtime environment. Once the text layer exists, each page's text is extracted with `pdftotext` (Poppler).

### 2. Text normalization

Each page's extracted text needs to be cleaned up: OCR errors, incorrect punctuation, stray whitespace, and other artifacts introduced by extraction. Every page's text is sent to the OpenAI API with a prompt designed for this task. This step is parallelizable, so pages are processed concurrently as independent jobs.

### 3. Audio generation

The normalized text from all pages is stitched back together into the original document text, and audio generation is kicked off through Google's Text-to-Speech API. The job periodically polls a Google endpoint for progress, and once generation finishes, the resulting audio is downloaded from a Cloud Storage bucket to the server.

Generation progress is streamed to the client in real time via Socket.IO.

## Tech stack

- **Framework:** NestJS
- **Database:** PostgreSQL + TypeORM
- **Queues:** BullMQ (Redis)
- **Realtime:** Socket.IO
- **Auth:** Google OAuth 2.0, JWT
- **OCR / text extraction:** ocrmypdf, Poppler (`pdftotext`)
- **Text normalization:** OpenAI API
- **Text-to-Speech & storage:** Google Cloud Text-to-Speech API, Google Cloud Storage

## Project setup

```bash
npm install
```

The app expects PostgreSQL and Redis to be available; a `docker-compose.yaml` is included to run both locally:

```bash
docker compose up -d
```

Copy `.env.development` / `.env.test` as a reference and fill in the required values (database and Redis connection, Google OAuth credentials, OpenAI API key, Google Cloud project/bucket/TTS settings, etc.) as defined in `src/config.schema.ts`.

## Compile and run the project

```bash
# development (watch mode)
npm run start:dev

# production mode
npm run start:prod
```

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
