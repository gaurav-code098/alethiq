FROM python:3.9-slim

WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a cache directory for models (Required by HF)
RUN mkdir -p /app/cache
ENV TRANSFORMERS_CACHE=/app/cache
RUN chmod 777 /app/cache

# Launch app on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]