# NutriScan backend — build context: ./backend (o repo tem frontend/, não copie)
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Usuário sem root (o volume /app/data herda este dono na 1ª montagem)
RUN useradd --create-home --uid 10001 nutriscan

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data \
 && chown -R nutriscan:nutriscan /app

USER nutriscan

EXPOSE 8000

# Seed no boot: idempotente (pula se o banco já tem produtos) — volume novo nasce populado
CMD ["sh", "-c", "python -m app.seed && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5)" || exit 1
