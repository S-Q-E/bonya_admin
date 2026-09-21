import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_pool, close_pool, pool
from .security import hash_password
from .routers import auth, dashboard, leads, conversations, metrics, errors


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    # Create tables + admin user on first startup
    async with pool().acquire() as c:
        await c.execute("""
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              name TEXT,
              role TEXT DEFAULT 'admin',
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        existing = await c.fetchval("SELECT 1 FROM users WHERE email = $1", settings.admin_email)
        if not existing:
            await c.execute(
                "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)",
                settings.admin_email,
                hash_password(settings.admin_password),
                "Admin",
            )
    yield
    await close_pool()


app = FastAPI(title="Bonya Admin API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, dashboard.router, leads.router, conversations.router, metrics.router, errors.router):
    app.include_router(r)


@app.get("/health")
async def health():
    return {"ok": True}


# Railway injects $PORT — uvicorn must listen on it
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))