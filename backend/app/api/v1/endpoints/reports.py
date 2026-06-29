from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pdfplumber
import io

from app.core.database import get_db
from app.models.models import User, MedicalReport, ReportStatus, Notification
from app.services.auth.jwt import get_current_user
from app.services.health.s3 import s3_service
from app.services.ai.gemini import gemini_service

router = APIRouter()


async def analyze_report_background(
    report_id: str,
    s3_key: str,
    file_name: str,
    file_content: bytes,
    db: AsyncSession,
    user_id: str,
):
    """Background job: extract PDF text → Gemini analysis → update DB."""
    try:
        # Extract text from PDF
        text = ""
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages[:10]:
                    text += (page.extract_text() or "") + "\n"
        except Exception:
            text = "Unable to extract text from this PDF."

        # Gemini analysis
        analysis = await gemini_service.analyze_medical_report(text, file_name)

        # Update report
        result = await db.execute(
            select(MedicalReport).where(MedicalReport.id == report_id)
        )
        report = result.scalar_one_or_none()
        if report:
            from datetime import datetime
            report.status = ReportStatus.completed
            report.ai_analysis = analysis
            report.extracted_data = {"text_length": len(text), "pages_processed": min(10, len(text)//500)}
            report.analyzed_at = datetime.utcnow()
            await db.commit()

        # Send notification
        notif = Notification(
            user_id=user_id,
            title="Report Analysis Complete",
            message=f"AI analysis of '{file_name}' is ready.",
            type="success",
        )
        db.add(notif)
        await db.commit()

    except Exception as e:
        result = await db.execute(
            select(MedicalReport).where(MedicalReport.id == report_id)
        )
        report = result.scalar_one_or_none()
        if report:
            report.status = ReportStatus.failed
            await db.commit()


@router.post("/upload")
async def upload_report(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(400, "File size must be under 10MB.")

    file_content = await file.read()

    # Upload to S3
    s3_key, s3_url = await s3_service.upload_medical_report(file, current_user.id)

    # Save report record
    report = MedicalReport(
        user_id=current_user.id,
        file_name=file.filename,
        s3_key=s3_key,
        s3_url=s3_url,
        file_size=len(file_content),
        status=ReportStatus.processing,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Queue background analysis
    background_tasks.add_task(
        analyze_report_background,
        report.id, s3_key, file.filename, file_content, db, current_user.id
    )

    return {
        "report_id": report.id,
        "file_name": file.filename,
        "status": "processing",
        "message": "Report uploaded. AI analysis will be ready shortly.",
    }


@router.get("/")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MedicalReport)
        .where(MedicalReport.user_id == current_user.id)
        .order_by(MedicalReport.uploaded_at.desc())
    )
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "file_name": r.file_name,
            "status": r.status,
            "uploaded_at": r.uploaded_at,
            "analyzed_at": r.analyzed_at,
            "file_size": r.file_size,
        }
        for r in reports
    ]


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MedicalReport).where(
            MedicalReport.id == report_id,
            MedicalReport.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not found.")

    url = await s3_service.get_file_url(report.s3_key)

    return {
        "id": report.id,
        "file_name": report.file_name,
        "status": report.status,
        "ai_analysis": report.ai_analysis,
        "extracted_data": report.extracted_data,
        "download_url": url,
        "uploaded_at": report.uploaded_at,
        "analyzed_at": report.analyzed_at,
    }
