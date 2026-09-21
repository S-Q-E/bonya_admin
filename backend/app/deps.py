from fastapi import Depends, HTTPException, Header
from .security import decode_token
from .db import pool


async def current_user(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    email = decode_token(authorization[7:])
    if not email:
        raise HTTPException(401, "Invalid token")
    async with pool().acquire() as c:
        row = await c.fetchrow(
            "SELECT id, email, name, role FROM users WHERE email=$1", email
        )
    if not row:
        raise HTTPException(401, "User not found")
    return dict(row)