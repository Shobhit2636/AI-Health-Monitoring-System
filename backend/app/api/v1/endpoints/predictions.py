from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json

from app.core.database import get_db
from app.core.redis import redis_client
from app.models.models import User, HealthPrediction
from app.services.auth.jwt import get_current_user
from app.services.ai.prediction import health_prediction_service

router = APIRouter()


class DiabetesPredictionRequest(BaseModel):
    glucose: float
    bmi: float
    age: int
    blood_pressure: float
    pregnancies: int = 0
    skin_thickness: float = 20.0
    insulin: float = 80.0
    diabetes_pedigree: float = 0.5


class HeartPredictionRequest(BaseModel):
    age: int
    sex: int  # 1=male, 0=female
    chest_pain_type: int  # 0-3
    resting_bp: float
    cholesterol: float
    fasting_blood_sugar: int = 0
    resting_ecg: int = 0
    max_heart_rate: float = 150
    exercise_angina: int = 0
    st_depression: float = 0.0
    st_slope: int = 1


class GeneralHealthRequest(BaseModel):
    age: int
    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    blood_glucose: float
    bmi: float
    heart_rate: Optional[float] = None
    cholesterol: Optional[float] = None


@router.post("/diabetes")
async def predict_diabetes(
    payload: DiabetesPredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = redis_client.cache_key("predict:diabetes", current_user.id, hash(str(payload.dict())))
    cached = await redis_client.get(cache_key)
    if cached:
        return cached

    result = health_prediction_service.predict_diabetes(payload.dict())

    prediction = HealthPrediction(
        user_id=current_user.id,
        prediction_type="diabetes",
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        confidence=result["confidence"],
        input_features=payload.dict(),
        recommendations=result["recommendations"],
        model_version=result["model_version"],
    )
    db.add(prediction)
    await db.commit()

    result["prediction_id"] = prediction.id
    await redis_client.set(cache_key, result, ttl=3600)
    return result


@router.post("/heart-disease")
async def predict_heart_disease(
    payload: HeartPredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = health_prediction_service.predict_heart_disease(payload.dict())

    prediction = HealthPrediction(
        user_id=current_user.id,
        prediction_type="heart_disease",
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        confidence=result["confidence"],
        input_features=payload.dict(),
        recommendations=result["recommendations"],
        model_version=result["model_version"],
    )
    db.add(prediction)
    await db.commit()

    result["prediction_id"] = prediction.id
    return result


@router.post("/general-health")
async def predict_general_health(
    payload: GeneralHealthRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = health_prediction_service.predict_general_health(payload.dict())

    prediction = HealthPrediction(
        user_id=current_user.id,
        prediction_type="general_health",
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        confidence=result["confidence"],
        input_features=payload.dict(),
        recommendations=result["recommendations"],
        model_version=result["model_version"],
    )
    db.add(prediction)
    await db.commit()

    result["prediction_id"] = prediction.id
    return result


@router.get("/history")
async def get_prediction_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
):
    cache_key = redis_client.cache_key("predict:history", current_user.id)
    cached = await redis_client.get(cache_key)
    if cached:
        return cached

    result = await db.execute(
        select(HealthPrediction)
        .where(HealthPrediction.user_id == current_user.id)
        .order_by(HealthPrediction.created_at.desc())
        .limit(limit)
    )
    predictions = result.scalars().all()

    data = [
        {
            "id": p.id,
            "type": p.prediction_type,
            "risk_level": p.risk_level,
            "risk_score": p.risk_score,
            "recommendations": p.recommendations,
            "created_at": p.created_at,
        }
        for p in predictions
    ]
    await redis_client.set(cache_key, data, ttl=300)
    return data
