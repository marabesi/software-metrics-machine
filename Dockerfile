# Use a lightweight Python base image
FROM python:3.13-alpine

WORKDIR /app

ENV PYTHONPATH="/app:/app"

RUN apk add --no-cache gcc g++ musl-dev libffi-dev openssl-dev make

COPY pyproject.toml poetry.lock README.md ./

RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --only main --no-interaction --no-ansi

COPY . .

EXPOSE 5006

CMD ["poetry", "run", "panel", "serve", "apps/dashboard/main.py"]