from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from ..db import pool
from ..deps import current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def stats(days: int = Query(7, ge=1, le=90), _=Depends(current_user)):
    since = datetime.utcnow() - timedelta(days=days)
    async with pool().acquire() as c:
        row = await c.fetchrow(
            """
            SELECT
              (SELECT COUNT(*) FROM instagram_leads) AS total_leads,
              (SELECT COUNT(*) FROM instagram_leads WHERE updated_at >= $1) AS leads_period,
              (SELECT COUNT(*) FROM bot_metrics WHERE created_at >= $1) AS messages_period,
              (SELECT COUNT(*) FROM bot_metrics WHERE created_at >= $1 AND is_lead = true) AS leads_from_chat,
              (SELECT COALESCE(AVG(ai_latency_ms), 0) FROM bot_metrics WHERE created_at >= $1) AS avg_ai_ms,
              (SELECT COALESCE(AVG(total_latency_ms), 0) FROM bot_metrics WHERE created_at >= $1) AS avg_total_ms,
              (SELECT COUNT(*) FROM bot_error_log WHERE created_at >= $1) AS errors_period,
              (SELECT COUNT(*) FROM instagram_leads WHERE muted_until > NOW()) AS muted_now
            """,
            since,
        )
    return dict(row)


@router.get("/timeseries")
async def timeseries(days: int = Query(14, ge=1, le=90), _=Depends(current_user)):
    since = datetime.utcnow() - timedelta(days=days)
    async with pool().acquire() as c:
        rows = await c.fetch(
            """
            SELECT date_trunc('day', created_at) AS day,
                   COUNT(*) AS messages,
                   COUNT(*) FILTER (WHERE is_lead = true) AS leads,
                   COALESCE(AVG(ai_latency_ms), 0)::int AS avg_ai_ms
            FROM bot_metrics WHERE created_at >= $1
            GROUP BY day ORDER BY day
            """,
            since,
        )
        by_city = await c.fetch(
            "SELECT COALESCE(city, '—') AS city, COUNT(*) AS cnt FROM instagram_leads WHERE city IS NOT NULL AND city <> '' GROUP BY city ORDER BY cnt DESC LIMIT 10"
        )
        by_course = await c.fetch(
            "SELECT COALESCE(course, '—') AS course, COUNT(*) AS cnt FROM instagram_leads WHERE course IS NOT NULL AND course <> '' GROUP BY course ORDER BY cnt DESC LIMIT 10"
        )
    return {
        "timeseries": [dict(r) for r in rows],
        "by_city": [dict(r) for r in by_city],
        "by_course": [dict(r) for r in by_course],
    }


@router.get("/recent")
async def recent(limit: int = 10, _=Depends(current_user)):
    async with pool().acquire() as c:
        leads = await c.fetch(
            "SELECT sender_id, ig_username, client_name, city, phone, course, updated_at FROM instagram_leads ORDER BY updated_at DESC NULLS LAST LIMIT $1",
            limit,
        )
        errs = await c.fetch(
            "SELECT node_name, error_message, sender_id, created_at FROM bot_error_log ORDER BY created_at DESC LIMIT $1",
            limit,
        )
    return {"leads": [dict(r) for r in leads], "errors": [dict(r) for r in errs]}