from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Dict

from app.core.database import get_db
from app.models.models import User, ChatSession, HealthProfile
from app.services.auth.jwt import get_current_user
from app.services.ai.gemini import gemini_service

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    session_id: str = None


@router.post("/message")
async def send_message(
    payload: ChatMessage,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get or create session
    session = None
    if payload.session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == payload.session_id,
                ChatSession.user_id == current_user.id,
            )
        )
        session = result.scalar_one_or_none()

    if not session:
        session = ChatSession(
            user_id=current_user.id,
            title=payload.message[:50] + "..." if len(payload.message) > 50 else payload.message,
            messages=[],
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

    # Build user context from health profile
    user_context = None
    profile_result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()
    if profile:
        user_context = {
            "age": profile.age,
            "conditions": profile.chronic_conditions or [],
            "medications": profile.medications or [],
        }

    history = session.messages or []

    # Add user message
    history.append({"role": "user", "content": payload.message})

    # Get AI response
    ai_response = await gemini_service.chat(
        message=payload.message,
        history=history[:-1],
        user_context=user_context,
    )

    # Add AI response
    history.append({"role": "model", "content": ai_response})

    # Save updated session (keep last 50 messages)
    session.messages = history[-50:]
    await db.commit()

    return {
        "session_id": session.id,
        "response": ai_response,
        "message_count": len(session.messages),
    }


@router.get("/sessions")
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(20)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "message_count": len(s.messages or []),
            "updated_at": s.updated_at,
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found.")

    return {
        "id": session.id,
        "title": session.title,
        "messages": session.messages,
        "created_at": session.created_at,
    }
