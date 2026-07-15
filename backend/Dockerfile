FROM python:3.12-slim

WORKDIR /app

# psycopg[binary] and the rest ship wheels — no build toolchain needed.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# ponytail: no gunicorn/workers tuning; uvicorn single-process is fine for this MVP.
# Add --workers or a gunicorn wrapper when it actually needs to scale.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
