FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Install build tools if needed for native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ .
COPY start.py .

EXPOSE 8000

CMD ["python", "start.py"]
