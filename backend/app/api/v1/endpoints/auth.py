from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.models.models import User, UserRole
from app.services.auth.jwt import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user
)

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.patient
    phone: str = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered.")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        phone=payload.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access = create_access_token({"sub": user.id, "role": user.role})
    refresh = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user={"id": user.id, "email": user.email, "name": user.full_name, "role": user.role},
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials.")
    if not user.is_active:
        raise HTTPException(403, "Account is deactivated.")

    access = create_access_token({"sub": user.id, "role": user.role})
    refresh = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user={"id": user.id, "email": user.email, "name": user.full_name, "role": user.role},
    )


@router.post("/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token.")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found.")

    access = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": access, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at,
    }
