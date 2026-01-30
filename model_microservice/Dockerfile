# ML Model Microservice Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install CPU-only PyTorch (smaller image, works for inference)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and models
COPY . .

# Ensure models directory exists
RUN mkdir -p /app/models

# Expose port
EXPOSE 5000

# Run Flask app
CMD ["python", "app.py"]
