from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import User, HealthRecord
from app.services.auth.jwt import get_current_user

router = APIRouter()

class HealthRecordCreate(BaseModel):
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    blood_glucose: Optional[float] = None
    cholesterol_total: Optional[float] = None
    cholesterol_hdl: Optional[float] = None
    cholesterol_ldl: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    temperature: Optional[float] = None
    hba1c: Optional[float] = None
    notes: Optional[str] = None

@router.post("/records")
async def create_record(
    payload: HealthRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = HealthRecord(user_id=current_user.id, **payload.dict())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {"id": record.id, "recorded_at": record.recorded_at, "message": "Health record saved."}

@router.get("/records")
async def list_records(
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(HealthRecord)
        .where(HealthRecord.user_id == current_user.id)
        .order_by(HealthRecord.recorded_at.desc())
        .limit(limit)
    )
    records = result.scalars().all()
    return [
        {
            "id": r.id,
            "recorded_at": r.recorded_at,
            "blood_pressure": f"{r.blood_pressure_systolic}/{r.blood_pressure_diastolic}" if r.blood_pressure_systolic else None,
            "heart_rate": r.heart_rate,
            "blood_glucose": r.blood_glucose,
            "cholesterol_total": r.cholesterol_total,
            "oxygen_saturation": r.oxygen_saturation,
            "temperature": r.temperature,
            "hba1c": r.hba1c,
            "notes": r.notes,
        }
        for r in records
    ]
