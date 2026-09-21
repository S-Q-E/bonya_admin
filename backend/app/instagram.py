import httpx
from .config import settings
from .db import pool


async def send_ig_message(recipient_id: str, text: str) -> dict:
    url = (
        f"https://graph.instagram.com/{settings.ig_api_version}"
        f"/{settings.ig_business_id}/messages"
    )
    headers = {"Authorization": f"Bearer {settings.ig_access_token}"}
    payload = {"recipient": {"id": recipient_id}, "message": {"text": text}}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()

    mid = data.get("message_id")
    if mid:
        async with pool().acquire() as c:
            await c.execute(
                """
                INSERT INTO bot_sent_messages (message_id, sender_id)
                VALUES ($1, $2) ON CONFLICT (message_id) DO NOTHING
                """,
                mid, recipient_id,
            )
    return data