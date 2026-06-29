from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.models.models import User, Notification
from app.services.auth.jwt import get_current_user

router = APIRouter()

@router.get("/")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unread_only: bool = False,
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(query)
    notifs = result.scalars().all()
    return [{"id": n.id, "title": n.title, "message": n.message, "type": n.type, "is_read": n.is_read, "created_at": n.created_at} for n in notifs]

@router.put("/{notif_id}/read")
async def mark_read(notif_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await db.execute(update(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id).values(is_read=True))
    await db.commit()
    return {"message": "Marked as read."}

@router.put("/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await db.execute(update(Notification).where(Notification.user_id == current_user.id).values(is_read=True))
    await db.commit()
    return {"message": "All notifications marked as read."}
