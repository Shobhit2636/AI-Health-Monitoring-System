from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.core.database import get_db
from app.models.models import User, HealthPrediction, MedicalReport
from app.services.auth.jwt import require_role

router = APIRouter()
require_admin_dep = require_role("admin")

@router.get("/users")
async def list_all_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin_dep)):
    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(100))
    users = result.scalars().all()
    return [{"id": u.id, "email": u.email, "name": u.full_name, "role": u.role, "is_active": u.is_active, "created_at": u.created_at} for u in users]

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin_dep)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")
    user.is_active = not user.is_active
    await db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}.", "is_active": user.is_active}

@router.get("/stats")
async def system_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin_dep)):
    users = await db.execute(select(func.count(User.id)))
    preds = await db.execute(select(func.count(HealthPrediction.id)))
    reports = await db.execute(select(func.count(MedicalReport.id)))
    return {"total_users": users.scalar(), "total_predictions": preds.scalar(), "total_reports": reports.scalar()}
