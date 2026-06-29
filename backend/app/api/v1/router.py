from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, health, predictions, reports, chatbot, notifications,
    doctor, admin, dashboard
)

api_router = APIRouter()

api_router.include_router(auth.router,          prefix="/auth",          tags=["Authentication"])
api_router.include_router(users.router,         prefix="/users",         tags=["Users"])
api_router.include_router(health.router,        prefix="/health",        tags=["Health Records"])
api_router.include_router(predictions.router,   prefix="/predictions",   tags=["AI Predictions"])
api_router.include_router(reports.router,       prefix="/reports",       tags=["Medical Reports"])
api_router.include_router(chatbot.router,       prefix="/chatbot",       tags=["AI Chatbot"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(doctor.router,        prefix="/doctor",        tags=["Doctor Portal"])
api_router.include_router(admin.router,         prefix="/admin",         tags=["Admin Portal"])
api_router.include_router(dashboard.router,     prefix="/dashboard",     tags=["Dashboard"])
