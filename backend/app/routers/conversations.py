import json
from fastapi import APIRouter, Depends, HTTPException
from ..db import pool
from ..deps import current_user
from ..schemas import SendMessageIn
from ..instagram import send_ig_message

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("")
async def list_conversations(limit: int = 50, _=Depends(current_user)):
    async with pool().acquire() as c:
        rows = await c.fetch(
            """
            WITH last AS (
                SELECT DISTINCT ON (session_id) session_id, message, id, created_at
                FROM n8n_chat_histories ORDER BY session_id, id DESC
            )
            SELECT l.session_id, l.message, l.created_at,
                   ld.ig_username, ld.client_name, ld.muted_until, ld.course
            FROM last l
            LEFT JOIN instagram_leads ld ON ld.sender_id = l.session_id
            ORDER BY l.id DESC LIMIT $1
            """,
            limit,
        )
    out = []
    for r in rows:
        m = r["message"] if isinstance(r["message"], dict) else {}
        out.append({
            "session_id": r["session_id"],
            "preview": m.get("content") or m.get("text") or "",
            "created_at": r["created_at"],
            "ig_username": r["ig_username"],
            "client_name": r["client_name"],
            "muted_until": r["muted_until"],
            "course": r["course"],
        })
    return out


@router.get("/{sender_id}/messages")
async def get_messages(sender_id: str, limit: int = 200, _=Depends(current_user)):
    async with pool().acquire() as c:
        rows = await c.fetch(
            "SELECT id, message, created_at FROM n8n_chat_histories WHERE session_id = $1 ORDER BY id ASC LIMIT $2",
            sender_id, limit,
        )
    out = []
    for r in rows:
        m = r["message"] if isinstance(r["message"], dict) else {}
        out.append({
            "id": r["id"],
            "role": m.get("type", "unknown"),
            "text": m.get("content") or m.get("text") or "",
            "ts": r["created_at"],
            "meta": {k: v for k, v in m.items() if k not in ("content", "text", "type")},
        })
    return out


@router.post("/{sender_id}/send")
async def send_manual(sender_id: str, data: SendMessageIn, _=Depends(current_user)):
    if not data.text.strip():
        raise HTTPException(400, "Empty message")
    result = await send_ig_message(sender_id, data.text)
    payload = json.dumps({"type": "ai", "content": data.text, "manual": True})
    async with pool().acquire() as c:
        await c.execute(
            "INSERT INTO n8n_chat_histories (session_id, message) VALUES ($1, $2::jsonb)",
            sender_id, payload,
        )
    return {"ok": True, "result": result}