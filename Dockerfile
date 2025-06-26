FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
# Install without running postinstall scripts to avoid prisma generate conflicts
RUN corepack enable pnpm && pnpm i --frozen-lockfile --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy package.json and package-lock/pnpm files first
COPY package*.json pnpm-lock.yaml* ./
# Copy Prisma schema first - this is crucial for prisma generate to work
COPY prisma ./prisma/
# Generate Prisma client early, before copying all source code
RUN corepack enable pnpm && pnpm prisma generate

# Now copy the rest of the application
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Build with dummy environment variables and skip env validation for Docker
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV AUTH_SECRET="dummy-auth-secret-for-build"
RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install netcat for database connectivity checks
RUN apk add --no-cache netcat-openbsd

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy Prisma files for runtime migrations
COPY --from=builder /app/prisma ./prisma/
# Copy only the necessary Prisma runtime files
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 5000

ENV PORT 5000
# Server listens on all interfaces but use proper external URL for redirects
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"] 