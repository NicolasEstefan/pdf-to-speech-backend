# Stage 1: Dependencies
FROM node:24-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Stage 2: Builder
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and configuration files
COPY . .

# Build the application
RUN npm run build

RUN cp -r src/external-services/llm/prompts dist/external-services/llm

# Stage 2.5: Production Dependencies
FROM node:24-alpine AS prod-deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Stage 3: Production
FROM node:24-alpine AS production

WORKDIR /app

# Install system dependencies for OCR and PDF processing
RUN apk add --no-cache \
  ghostscript \
  tesseract-ocr \
  tesseract-ocr-data-spa \
  poppler-utils \
  python3 \
  py3-pip \
  py3-lxml \
  py3-pillow \
  py3-reportlab \
  qpdf \
  unpaper \
  pngquant \
  jbig2enc \
  && pip3 install --no-cache-dir --break-system-packages ocrmypdf

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Create necessary directories with proper permissions
RUN mkdir -p /app/files /app/files/pdfs /app/files/audios /app/logs && \
  chown -R nestjs:nodejs /app/files /app/logs

# Switch to non-root user
USER nestjs

# Set production environment
ENV NODE_ENV=production

# Expose the application port (adjust if your app uses a different port)
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
