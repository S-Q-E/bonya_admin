from fastapi import APIRouter, Depends, Query, HTTPException
from ..db import pool
from ..deps import current_user
from ..schemas import LeadPatch

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.get("")
async def list_leads(
    q: str | None = None,
    city: str | None = None,
    course: str | None = None,
    is_muted: bool | None = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    _=Depends(current_user),
):
    conds, args = ["1=1"], []
    if q:
        args.append(f"%{q}%")
        conds.append(f"(ig_username ILIKE ${len(args)} OR client_name ILIKE ${len(args)} OR phone ILIKE ${len(args)})")
    if city:
        args.append(city); conds.append(f"city = ${len(args)}")
    if course:
        args.append(course); conds.append(f"course = ${len(args)}")
    if is_muted is True:
        conds.append("muted_until > NOW()")
    if is_muted is False:
        conds.append("(muted_until IS NULL OR muted_until <= NOW())")

    where = " AND ".join(conds)
    async with pool().acquire() as c:
        rows = await c.fetch(
            f"SELECT * FROM instagram_leads WHERE {where} ORDER BY updated_at DESC NULLS LAST LIMIT {limit} OFFSET {offset}",
            *args,
        )
        total = await c.fetchval(f"SELECT COUNT(*) FROM instagram_leads WHERE {where}", *args)
    return {"items": [dict(r) for r in rows], "total": total}


@router.get("/{sender_id}")
async def get_lead(sender_id: str, _=Depends(current_user)):
    async with pool().acquire() as c:
        row = await c.fetchrow("SELECT * FROM instagram_leads WHERE sender_id=$1", sender_id)
    if not row:
        raise HTTPException(404, "Lead not found")
    return dict(row)


@router.patch("/{sender_id}")
async def patch_lead(sender_id: str, data: LeadPatch, _=Depends(current_user)):
    fields = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if not fields:
        return {"ok": True}
    set_clause = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields))
    async with pool().acquire() as c:
        await c.execute(
            f"UPDATE instagram_leads SET {set_clause}, updated_at = NOW() WHERE sender_id = $1",
            sender_id, *fields.values(),
        )
    return {"ok": True}


@router.post("/{sender_id}/mute")
async def mute(sender_id: str, _=Depends(current_user)):
    async with pool().acquire() as c:
        await c.execute(
            """
            INSERT INTO instagram_leads (sender_id, muted_until)
            VALUES ($1, NOW() + INTERVAL '100 years')
            ON CONFLICT (sender_id) DO UPDATE SET muted_until = EXCLUDED.muted_until
            """,
            sender_id,
        )
    return {"ok": True}


@router.post("/{sender_id}/unmute")
async def unmute(sender_id: str, _=Depends(current_user)):
    async with pool().acquire() as c:
        await c.execute(
            "UPDATE instagram_leads SET muted_until = NOW() - INTERVAL '1 second' WHERE sender_id = $1",
            sender_id,
        )
    return {"ok": True}