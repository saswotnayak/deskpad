# ---- Stage 1: Build ----
FROM node:22-slim AS builder
WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ---- Stage 2: Serve ----
# Note: In production, nginx serves the built files.
# This stage just holds the built artifacts for docker-compose to copy.
FROM node:22-slim AS artifacts
WORKDIR /app
COPY --from=builder /app/dist ./dist

# Default command (not actually used — nginx serves these files)
CMD ["echo", "Frontend build complete. Files in /app/dist"]
