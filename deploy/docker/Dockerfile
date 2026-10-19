# Yarvelle — Personal & Family AI Assistant Application
# Copyright 2026 Spectrayan (https://spectrayan.com)
#
# Licensed under the PolyForm Noncommercial License 1.0.0 and the
# Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
# Personal and household local use only. Commercial use, hosted service
# offering, rebranding, white-labeling, and redistribution of modified
# forks are prohibited without a written commercial license from Spectrayan.
#
# Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)

FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels .

FROM python:3.12-slim AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 yarvelle && \
    adduser --system --uid 1001 --ingroup yarvelle yarvelle

COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY src/ /app/src/
COPY packs/ /app/packs/
COPY yarvelle.yaml /app/yarvelle.yaml

USER yarvelle

ENV YARVELLE_HOST=0.0.0.0 \
    YARVELLE_PORT=8000 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "-m", "yarvelle.main"]
