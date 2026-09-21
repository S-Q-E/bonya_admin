from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LeadPatch(BaseModel):
    client_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    target_weight: Optional[str] = None
    course: Optional[str] = None


class SendMessageIn(BaseModel):
    text: str