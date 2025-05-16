# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

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

# Copy everything and build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Create production image
FROM node:20-alpine AS runner
WORKDIR /app

# Add necessary system dependencies
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production

# Copy required files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/next.config.js ./next.config.js

# Expose the Next.js port
EXPOSE 3000

# Run the app
CMD ["npx", "next", "start"]