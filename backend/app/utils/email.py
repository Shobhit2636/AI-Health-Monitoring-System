import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from loguru import logger
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.available = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
        if not self.available:
            logger.warning("SMTP not configured. Emails will be logged only.")

    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        if not self.available:
            logger.info(f"[EMAIL DEMO] To: {to} | Subject: {subject}")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = f"AI Health Monitor <{settings.SMTP_USER}>"
            msg["To"]      = to

            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, to, msg.as_string())

            logger.info(f"Email sent to {to}")
            return True
        except Exception as e:
            logger.error(f"Email send error: {e}")
            return False

    async def send_welcome_email(self, to: str, name: str) -> bool:
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
          <div style="background:#2563eb;border-radius:16px;padding:30px;text-align:center;margin-bottom:30px">
            <h1 style="color:white;margin:0;font-size:24px">❤️ Welcome to AI Health Monitor</h1>
          </div>
          <h2 style="color:#1f2937">Hi {name}! 👋</h2>
          <p style="color:#6b7280;line-height:1.6">
            Your account has been created successfully. You can now:
          </p>
          <ul style="color:#6b7280;line-height:2">
            <li>📊 Track your health vitals</li>
            <li>🤖 Get AI-powered health predictions</li>
            <li>📄 Upload & analyze medical reports</li>
            <li>💬 Chat with HealthBot 24/7</li>
          </ul>
          <a href="http://localhost:3000/dashboard"
             style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;
                    border-radius:10px;text-decoration:none;font-weight:600;margin-top:20px">
            Open Dashboard →
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:30px">
            This is an automated email. Please do not reply.
          </p>
        </div>
        """
        return await self.send_email(to, "Welcome to AI Health Monitor! 🎉", html)

    async def send_high_risk_alert(self, to: str, name: str, risk_type: str, risk_level: str) -> bool:
        color = {"low": "#10b981", "moderate": "#f59e0b", "high": "#f97316", "critical": "#ef4444"}.get(risk_level, "#6b7280")
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
          <div style="background:{color};border-radius:16px;padding:30px;text-align:center;margin-bottom:30px">
            <h1 style="color:white;margin:0;font-size:22px">⚠️ Health Risk Alert</h1>
          </div>
          <h2 style="color:#1f2937">Hi {name},</h2>
          <p style="color:#6b7280;line-height:1.6">
            Your recent AI health assessment indicates a <strong style="color:{color}">{risk_level.upper()} RISK</strong>
            for <strong>{risk_type.replace("_", " ").title()}</strong>.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin:20px 0">
            <p style="color:#dc2626;margin:0;font-weight:500">
              ⚠️ We recommend consulting a healthcare professional as soon as possible.
            </p>
          </div>
          <a href="http://localhost:3000/predictions"
             style="display:inline-block;background:{color};color:white;padding:14px 28px;
                    border-radius:10px;text-decoration:none;font-weight:600">
            View Full Report →
          </a>
        </div>
        """
        return await self.send_email(to, f"⚠️ Health Risk Alert: {risk_type.replace('_',' ').title()}", html)

    async def send_report_ready_email(self, to: str, name: str, file_name: str) -> bool:
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
          <div style="background:#10b981;border-radius:16px;padding:30px;text-align:center;margin-bottom:30px">
            <h1 style="color:white;margin:0;font-size:22px">✅ Report Analysis Ready</h1>
          </div>
          <h2 style="color:#1f2937">Hi {name},</h2>
          <p style="color:#6b7280;line-height:1.6">
            Your medical report <strong>"{file_name}"</strong> has been analyzed by our AI system.
          </p>
          <a href="http://localhost:3000/reports"
             style="display:inline-block;background:#10b981;color:white;padding:14px 28px;
                    border-radius:10px;text-decoration:none;font-weight:600">
            View Analysis →
          </a>
        </div>
        """
        return await self.send_email(to, "Your medical report analysis is ready! ✅", html)


email_service = EmailService()
