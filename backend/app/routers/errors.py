from fastapi import APIRouter, Depends, Query
from ..db import pool
from ..deps import current_user

router = APIRouter(prefix="/api/errors", tags=["errors"])


@router.get("")
async def list_errors(
    stage: str | None = None,
    node: str | None = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    _=Depends(current_user),
):
    conds, args = ["1=1"], []
    if stage:
        args.append(stage); conds.append(f"error_stage = ${len(args)}")
    if node:
        args.append(node); conds.append(f"node_name = ${len(args)}")
    where = " AND ".join(conds)

    async with pool().acquire() as c:
        rows = await c.fetch(
            f"SELECT * FROM bot_error_log WHERE {where} ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}",
            *args,
        )
        stages = await c.fetch(
            "SELECT DISTINCT error_stage FROM bot_error_log WHERE error_stage IS NOT NULL ORDER BY 1"
        )
    return {"items": [dict(r) for r in rows], "stages": [r["error_stage"] for r in stages]}