# users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.models import User, HealthProfile
from app.services.auth.jwt import get_current_user

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_type: Optional[str] = None
    allergies: Optional[list] = None
    chronic_conditions: Optional[list] = None
    medications: Optional[list] = None


@router.get("/profile")
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile_result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "avatar_url": current_user.avatar_url,
        "health_profile": {
            "age": profile.age if profile else None,
            "gender": profile.gender if profile else None,
            "height_cm": profile.height_cm if profile else None,
            "weight_kg": profile.weight_kg if profile else None,
            "bmi": profile.bmi if profile else None,
            "blood_type": profile.blood_type if profile else None,
            "allergies": profile.allergies if profile else [],
            "chronic_conditions": profile.chronic_conditions if profile else [],
            "medications": profile.medications if profile else [],
        } if profile else None,
    }


@router.put("/profile")
async def update_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.phone:
        current_user.phone = payload.phone

    profile_result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        profile = HealthProfile(user_id=current_user.id)
        db.add(profile)

    for field in ["age", "gender", "height_cm", "weight_kg", "blood_type", "allergies", "chronic_conditions", "medications"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(profile, field, val)

    await db.commit()
    return {"message": "Profile updated successfully."}
