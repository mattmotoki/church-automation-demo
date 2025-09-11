FROM python:3.11-slim

WORKDIR /app

# Copy Python requirements and install
COPY railway-api/requirements.txt ./railway-api/
RUN pip install --no-cache-dir -r railway-api/requirements.txt

# Copy the rest of the application
COPY railway-api ./railway-api

# Run the application (Railway will set PORT environment variable)
CMD uvicorn railway-api.app.main:app --host 0.0.0.0 --port ${PORT:-8000}