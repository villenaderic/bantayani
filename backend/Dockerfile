FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Build context is the repository root (see docker-compose.yml), so this
# reaches both backend/ and the sibling geospatial/ package. The detection
# algorithms live in geospatial/ rather than inside backend/ because they
# are meant to be shared logic, not backend-specific application code, even
# though the backend is currently the only thing that imports them.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY geospatial ./geospatial

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
