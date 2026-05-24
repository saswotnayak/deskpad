# ---- Stage 1: Build frontend ----
FROM node:22-slim AS frontend-builder
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY frontend/ .
RUN npm run build

# ---- Stage 2: Nginx with built frontend ----
FROM nginx:stable-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend assets
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
