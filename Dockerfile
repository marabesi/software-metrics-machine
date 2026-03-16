# syntax = docker/dockerfile:1

# Stage 1: Build frontend (Next.js)
FROM node:25-slim AS frontend-builder

WORKDIR /workspace/webapp

# Copy package files
COPY webapp/package.json webapp/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY webapp/ .

# Build frontend to static export (configured in next.config.ts)
RUN npm run build

# Stage 2: Build API
FROM python:3.14-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates default-jre \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry

# Use the system Python (don't create virtualenv)
RUN poetry config virtualenvs.create false

# Copy API project files
COPY api/pyproject.toml api/poetry.lock api/README.md ./

# Install Python dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy API source code
COPY api/ .

# Install the package
RUN poetry install --no-interaction --no-ansi

# Copy frontend static assets from build stage
COPY --from=frontend-builder /workspace/webapp/out ./static

# Configure git
RUN git config --system --add safe.directory '*'

# Expose port for FastAPI
EXPOSE 8000

# Default command (can be overridden)
CMD ["poetry", "run", "smm-rest", "--host", "0.0.0.0", "--port", "8000"]
