# syntax = docker/dockerfile:1

# Stage 1: Build frontend (Next.js)
FROM node:25-slim AS frontend-builder

WORKDIR /workspace/apps/webapp

# Copy package files
COPY webapp/package.json webapp/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY webapp/ .

# Build frontend to static export (configured in next.config.ts)
RUN npm run build

# Configure git
RUN git config --system --add safe.directory '*'

# Expose port for FastAPI
EXPOSE 8000

# Default command (can be overridden)
CMD ["poetry", "run", "smm-rest", "--host", "0.0.0.0", "--port", "8000"]
