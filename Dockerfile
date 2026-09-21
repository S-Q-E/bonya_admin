# ---------- Stage 1: Build Frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
# Результат: /app/frontend/dist

# ---------- Stage 2: Runtime ----------
FROM python:3.12-slim

# Системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor curl \
    && rm -rf /var/lib/apt/lists/*

# ---------- Backend ----------
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# ---------- Frontend (статика) ----------
COPY --from=frontend-build /app/frontend/dist /var/www/html

# ---------- Nginx: раздаёт статику + проксирует /api ----------
COPY nginx.conf /etc/nginx/sites-available/default

# ---------- Supervisor: запускает uvicorn + nginx ----------
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
