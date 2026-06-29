from sqlalchemy import (Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum)
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum, uuid

def gen_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    patient = "patient"
    doctor  = "doctor"
    admin   = "admin"

class RiskLevel(str, enum.Enum):
    low      = "low"
    moderate = "moderate"
    high     = "high"
    critical = "critical"

class ReportStatus(str, enum.Enum):
    pending    = "pending"
    processing = "processing"
    completed  = "completed"
    failed     = "failed"

class User(Base):
    __tablename__ = "users"
    id              = Column(String, primary_key=True, default=gen_uuid)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(255), nullable=False)
    role            = Column(String(20), default="patient", nullable=False)
    is_active       = Column(Boolean, default=True)
    is_verified     = Column(Boolean, default=False)
    avatar_url      = Column(String(500))
    phone           = Column(String(20))
    date_of_birth   = Column(DateTime)
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now())

    health_profile  = relationship("HealthProfile",  back_populates="user", uselist=False)
    health_records  = relationship("HealthRecord",   back_populates="user", foreign_keys="HealthRecord.user_id")
    predictions     = relationship("HealthPrediction", back_populates="user")
    reports         = relationship("MedicalReport",  back_populates="user")
    doctor_profile  = relationship("DoctorProfile",  back_populates="user", uselist=False)
    notifications   = relationship("Notification",   back_populates="user")
    chat_sessions   = relationship("ChatSession",    back_populates="user")

class HealthProfile(Base):
    __tablename__ = "health_profiles"
    id                  = Column(String, primary_key=True, default=gen_uuid)
    user_id             = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    age                 = Column(Integer)
    gender              = Column(String(10))
    height_cm           = Column(Float)
    weight_kg           = Column(Float)
    blood_type          = Column(String(5))
    allergies           = Column(JSON, default=list)
    chronic_conditions  = Column(JSON, default=list)
    medications         = Column(JSON, default=list)
    emergency_contact   = Column(JSON)
    created_at          = Column(DateTime, server_default=func.now())
    updated_at          = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="health_profile")

    @property
    def bmi(self):
        if self.height_cm and self.weight_kg:
            h = self.height_cm / 100
            return round(self.weight_kg / (h * h), 1)
        return None

class HealthRecord(Base):
    __tablename__ = "health_records"
    id                       = Column(String, primary_key=True, default=gen_uuid)
    user_id                  = Column(String, ForeignKey("users.id"), nullable=False)
    recorded_at              = Column(DateTime, server_default=func.now())
    blood_pressure_systolic  = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    heart_rate               = Column(Integer)
    blood_glucose            = Column(Float)
    cholesterol_total        = Column(Float)
    cholesterol_hdl          = Column(Float)
    cholesterol_ldl          = Column(Float)
    oxygen_saturation        = Column(Float)
    temperature              = Column(Float)
    hba1c                    = Column(Float)
    notes                    = Column(Text)
    recorded_by              = Column(String, ForeignKey("users.id"))
    user = relationship("User", back_populates="health_records", foreign_keys=[user_id])

class HealthPrediction(Base):
    __tablename__ = "health_predictions"
    id              = Column(String, primary_key=True, default=gen_uuid)
    user_id         = Column(String, ForeignKey("users.id"), nullable=False)
    prediction_type = Column(String(50), nullable=False)
    risk_level      = Column(String(20), nullable=False)
    risk_score      = Column(Float, nullable=False)
    confidence      = Column(Float)
    input_features  = Column(JSON)
    recommendations = Column(JSON, default=list)
    model_version   = Column(String(20), default="1.0.0")
    created_at      = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="predictions")

class MedicalReport(Base):
    __tablename__ = "medical_reports"
    id             = Column(String, primary_key=True, default=gen_uuid)
    user_id        = Column(String, ForeignKey("users.id"), nullable=False)
    file_name      = Column(String(255), nullable=False)
    s3_key         = Column(String(500), nullable=False)
    s3_url         = Column(String(500))
    file_size      = Column(Integer)
    status         = Column(String(20), default="pending")
    ai_analysis    = Column(Text)
    extracted_data = Column(JSON)
    report_type    = Column(String(100))
    uploaded_at    = Column(DateTime, server_default=func.now())
    analyzed_at    = Column(DateTime)
    user = relationship("User", back_populates="reports")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    id               = Column(String, primary_key=True, default=gen_uuid)
    user_id          = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    license_number   = Column(String(100), unique=True)
    specialization   = Column(String(100))
    hospital         = Column(String(255))
    experience_years = Column(Integer)
    bio              = Column(Text)
    consultation_fee = Column(Float)
    available_slots  = Column(JSON, default=list)
    verified         = Column(Boolean, default=False)
    rating           = Column(Float, default=0.0)
    total_reviews    = Column(Integer, default=0)
    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor")

class Appointment(Base):
    __tablename__ = "appointments"
    id           = Column(String, primary_key=True, default=gen_uuid)
    patient_id   = Column(String, ForeignKey("users.id"), nullable=False)
    doctor_id    = Column(String, ForeignKey("doctor_profiles.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    status       = Column(String(20), default="scheduled")
    notes        = Column(Text)
    diagnosis    = Column(Text)
    prescription = Column(JSON, default=list)
    created_at   = Column(DateTime, server_default=func.now())
    doctor = relationship("DoctorProfile", back_populates="appointments")

class Notification(Base):
    __tablename__ = "notifications"
    id         = Column(String, primary_key=True, default=gen_uuid)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    title      = Column(String(255), nullable=False)
    message    = Column(Text, nullable=False)
    type       = Column(String(50), default="info")
    is_read    = Column(Boolean, default=False)
    data       = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User", back_populates="notifications")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id         = Column(String, primary_key=True, default=gen_uuid)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    title      = Column(String(255), default="Health Query")
    messages   = Column(JSON, default=list)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="chat_sessions")
