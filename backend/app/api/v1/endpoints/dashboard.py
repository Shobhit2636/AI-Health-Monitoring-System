from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.redis import redis_client
from app.models.models import User, HealthRecord, HealthPrediction, MedicalReport, Notification
from app.services.auth.jwt import get_current_user, require_role

router = APIRouter()
require_admin_dep = require_role("admin")

@router.get("/patient")
async def patient_dashboard(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    cache_key = redis_client.cache_key("dashboard:patient", current_user.id)
    cached = await redis_client.get(cache_key)
    if cached:
        return cached

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    records_result = await db.execute(
        select(HealthRecord).where(HealthRecord.user_id == current_user.id, HealthRecord.recorded_at >= thirty_days_ago).order_by(HealthRecord.recorded_at)
    )
    records = records_result.scalars().all()

    pred_result = await db.execute(
        select(HealthPrediction).where(HealthPrediction.user_id == current_user.id).order_by(desc(HealthPrediction.created_at)).limit(3)
    )
    recent_predictions = pred_result.scalars().all()

    total_reports = (await db.execute(select(func.count(MedicalReport.id)).where(MedicalReport.user_id == current_user.id))).scalar()
    unread_notifs = (await db.execute(select(func.count(Notification.id)).where(Notification.user_id == current_user.id, Notification.is_read == False))).scalar()

    vitals_timeline = [
        {"date": r.recorded_at.strftime("%Y-%m-%d") if r.recorded_at else "N/A",
         "systolic": r.blood_pressure_systolic, "diastolic": r.blood_pressure_diastolic,
         "glucose": r.blood_glucose, "heart_rate": r.heart_rate}
        for r in records
    ]

    data = {
        "summary": {"total_records": len(records), "total_reports": total_reports, "unread_notifications": unread_notifs, "active_predictions": len(recent_predictions)},
        "vitals_timeline": vitals_timeline,
        "recent_predictions": [{"type": p.prediction_type, "risk_level": p.risk_level, "risk_score": p.risk_score, "date": p.created_at} for p in recent_predictions],
        "latest_vitals": {
            "blood_pressure": f"{records[-1].blood_pressure_systolic}/{records[-1].blood_pressure_diastolic}" if records and records[-1].blood_pressure_systolic else None,
            "glucose": records[-1].blood_glucose if records else None,
            "heart_rate": records[-1].heart_rate if records else None,
        } if records else {},
    }
    await redis_client.set(cache_key, data, ttl=180)
    return data

@router.get("/admin")
async def admin_dashboard(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin_dep)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_predictions = (await db.execute(select(func.count(HealthPrediction.id)))).scalar()
    total_reports = (await db.execute(select(func.count(MedicalReport.id)))).scalar()
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users = (await db.execute(select(func.count(User.id)).where(User.created_at >= week_ago))).scalar()
    return {"totals": {"users": total_users, "predictions": total_predictions, "reports": total_reports, "new_users_this_week": new_users}}
