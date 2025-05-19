# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG POSTGRES_PORT
ARG DATABASE_URL=placeholder

# Add necessary system dependencies
RUN apk add --no-cache libc6-compat

# Copy only the package files and install deps
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Stage 2: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

# Add necessary system dependencies
RUN apk add --no-cache libc6-compat

# Set dummy environment variables for build time only
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=postgres
ENV POSTGRES_PORT=5432
ENV REDIS_URL=redis://localhost:6379
ENV REDIS_USER=default
ENV REDIS_PASSWORD=password
ENV NODE_ENV=production
ENV NEXT_PHASE=phase-production-build

# Copy everything and build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Create production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV POSTGRES_USER=${POSTGRES_USER}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ENV POSTGRES_DB=${POSTGRES_DB}
ENV POSTGRES_PORT=${POSTGRES_PORT}
ENV DATABASE_URL=${DATABASE_URL}

# Add necessary system dependencies
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production

# Copy required files from builder
COPY --from=builder /app /app
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
# COPY --from=builder /app/next.config.js ./next.config.js

# Expose the Next.js port
EXPOSE 3000

# Run the app
CMD ["npx", "next", "start"]