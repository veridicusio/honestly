# Honestly API - Cloud Run Optimized
FROM python:3.11-slim

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better caching)
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy application code
COPY . .

# Cloud Run uses PORT env variable
ENV PORT=8080

# Run Cloud Run optimized app
CMD exec uvicorn api.app_cloudrun:app --host 0.0.0.0 --port ${PORT} --workers 1
