from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from ..db import pool
from ..deps import current_user

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/summary")
async def summary(days: int = Query(30, ge=1, le=180), _=Depends(current_user)):
    since = datetime.utcnow() - timedelta(days=days)
    async with pool().acquire() as c:
        row = await c.fetchrow(
            """
            SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_lead = true) AS leads,
              COUNT(*) FILTER (WHERE message_type = 'audio') AS audios,
              COUNT(*) FILTER (WHERE message_type = 'text') AS texts,
              COALESCE(AVG(ai_latency_ms), 0)::int AS avg_ai_ms,
              COALESCE(AVG(total_latency_ms), 0)::int AS avg_total_ms,
              COALESCE(percentile_disc(0.95) WITHIN GROUP (ORDER BY ai_latency_ms), 0)::int AS p95_ai_ms,
              COALESCE(percentile_disc(0.95) WITHIN GROUP (ORDER BY total_latency_ms), 0)::int AS p95_total_ms
            FROM bot_metrics WHERE created_at >= $1
            """,
            since,
        )
        langs = await c.fetch(
            "SELECT COALESCE(language, 'unknown') AS lang, COUNT(*) AS cnt FROM bot_metrics WHERE created_at >= $1 GROUP BY lang ORDER BY cnt DESC",
            since,
        )
    return {**dict(row), "languages": [dict(r) for r in langs]}


@router.get("/hourly")
async def hourly(days: int = 7, _=Depends(current_user)):
    since = datetime.utcnow() - timedelta(days=days)
    async with pool().acquire() as c:
        rows = await c.fetch(
            """
            SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Almaty')::int AS hour,
                   COUNT(*) AS cnt
            FROM bot_metrics WHERE created_at >= $1
            GROUP BY hour ORDER BY hour
            """,
            since,
        )
    return [dict(r) for r in rows]