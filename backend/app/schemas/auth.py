from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    language: str = 'en'
    location: Optional[str] = None

class FarmerRegister(UserBase):
    password: str

class TraderRegister(UserBase):
    password: str
    licence_number: str
    licence_expiry: Optional[datetime] = None

class AgentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    service_area: Optional[str] = None
    commission_rate: float = 0.0

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: str
    language: str
    location: Optional[str]
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True