# 1. Base Image - Node.js 20 on Debian Linux
FROM node:20-slim AS base

# Install Python 3, FFmpeg, and curl required for yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# 2. Dependencies step
FROM base AS deps
COPY COPY leo-downloader/package.json leo-downloader/pnpm-lock.yaml leo-downloader/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 3. Builder step
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY leo-downloader .

# Set environment for standalone Next.js build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm run build

# 4. Production Runner step
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy output files from standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]