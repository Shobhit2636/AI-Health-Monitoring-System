from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import User, HealthRecord
from app.services.auth.jwt import require_role

router = APIRouter()
require_doctor_dep = require_role("doctor", "admin")

@router.get("/patients")
async def list_patients(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_doctor_dep)):
    result = await db.execute(select(User).where(User.role == "patient", User.is_active == True).limit(50))
    patients = result.scalars().all()
    return [{"id": p.id, "name": p.full_name, "email": p.email, "created_at": p.created_at} for p in patients]

@router.get("/patients/{patient_id}/records")
async def get_patient_records(patient_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_doctor_dep)):
    result = await db.execute(select(HealthRecord).where(HealthRecord.user_id == patient_id).order_by(HealthRecord.recorded_at.desc()).limit(20))
    records = result.scalars().all()
    return [{"id": r.id, "recorded_at": r.recorded_at, "blood_pressure_systolic": r.blood_pressure_systolic, "blood_glucose": r.blood_glucose, "heart_rate": r.heart_rate} for r in records]
