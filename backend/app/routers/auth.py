from fastapi import APIRouter, HTTPException, Depends
from ..db import pool
from ..security import verify_password, create_token
from ..schemas import LoginIn, TokenOut
from ..deps import current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn):
    async with pool().acquire() as c:
        row = await c.fetchrow(
            "SELECT email, password_hash FROM users WHERE email=$1", data.email
        )
    if not row or not verify_password(data.password, row["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    return TokenOut(access_token=create_token(row["email"]))


@router.get("/me")
async def me(user=Depends(current_user)):
    return user