from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ─── Enums ──────────────────────────────────────────────────
class UserRole(str, Enum):
    patient = "patient"
    doctor  = "doctor"
    admin   = "admin"

class RiskLevel(str, Enum):
    low      = "low"
    moderate = "moderate"
    high     = "high"
    critical = "critical"

class ReportStatus(str, Enum):
    pending    = "pending"
    processing = "processing"
    completed  = "completed"
    failed     = "failed"


# ─── Auth Schemas ────────────────────────────────────────────
class UserRegister(BaseModel):
    email:     EmailStr
    password:  str = Field(min_length=8, description="Min 8 characters")
    full_name: str = Field(min_length=2, max_length=100)
    role:      UserRole = UserRole.patient
    phone:     Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    user:          dict


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── User Schemas ────────────────────────────────────────────
class UserOut(BaseModel):
    id:           str
    email:        str
    full_name:    str
    role:         UserRole
    is_active:    bool
    is_verified:  bool
    avatar_url:   Optional[str]
    phone:        Optional[str]
    created_at:   datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name:          Optional[str] = Field(None, min_length=2, max_length=100)
    phone:              Optional[str] = None
    age:                Optional[int] = Field(None, ge=0, le=150)
    gender:             Optional[str] = Field(None, pattern="^(male|female|other)$")
    height_cm:          Optional[float] = Field(None, ge=50, le=300)
    weight_kg:          Optional[float] = Field(None, ge=1, le=500)
    blood_type:         Optional[str] = Field(None, pattern="^(A|B|AB|O)[+-]$")
    allergies:          Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    medications:        Optional[List[str]] = None


class HealthProfileOut(BaseModel):
    age:                Optional[int]
    gender:             Optional[str]
    height_cm:          Optional[float]
    weight_kg:          Optional[float]
    bmi:                Optional[float]
    blood_type:         Optional[str]
    allergies:          List[str] = []
    chronic_conditions: List[str] = []
    medications:        List[str] = []


# ─── Health Record Schemas ───────────────────────────────────
class HealthRecordCreate(BaseModel):
    blood_pressure_systolic:  Optional[int]   = Field(None, ge=50,  le=300)
    blood_pressure_diastolic: Optional[int]   = Field(None, ge=20,  le=200)
    heart_rate:               Optional[int]   = Field(None, ge=20,  le=300)
    blood_glucose:            Optional[float] = Field(None, ge=20,  le=800)
    cholesterol_total:        Optional[float] = Field(None, ge=50,  le=1000)
    cholesterol_hdl:          Optional[float] = Field(None, ge=10,  le=200)
    cholesterol_ldl:          Optional[float] = Field(None, ge=10,  le=500)
    oxygen_saturation:        Optional[float] = Field(None, ge=50,  le=100)
    temperature:              Optional[float] = Field(None, ge=30,  le=45)
    hba1c:                    Optional[float] = Field(None, ge=3.0, le=20.0)
    notes:                    Optional[str]   = Field(None, max_length=1000)


class HealthRecordOut(BaseModel):
    id:                       str
    recorded_at:              datetime
    blood_pressure:           Optional[str]
    heart_rate:               Optional[int]
    blood_glucose:            Optional[float]
    cholesterol_total:        Optional[float]
    oxygen_saturation:        Optional[float]
    temperature:              Optional[float]
    hba1c:                    Optional[float]
    notes:                    Optional[str]


# ─── Prediction Schemas ──────────────────────────────────────
class DiabetesPredictionIn(BaseModel):
    glucose:            float = Field(ge=50,  le=400,  description="Blood glucose mg/dL")
    bmi:                float = Field(ge=10,  le=60,   description="Body Mass Index")
    age:                int   = Field(ge=1,   le=120)
    blood_pressure:     float = Field(ge=40,  le=200,  description="Diastolic BP mmHg")
    pregnancies:        int   = Field(ge=0,   le=20,   default=0)
    insulin:            float = Field(ge=0,   le=900,  default=80)
    diabetes_pedigree:  float = Field(ge=0,   le=2.5,  default=0.5)
    skin_thickness:     float = Field(ge=0,   le=100,  default=20)


class HeartPredictionIn(BaseModel):
    age:             int   = Field(ge=1,   le=120)
    sex:             int   = Field(ge=0,   le=1,    description="1=male, 0=female")
    chest_pain_type: int   = Field(ge=0,   le=3,    description="0=typical, 1=atypical, 2=non-anginal, 3=asymptomatic")
    resting_bp:      float = Field(ge=60,  le=250,  description="Resting BP mmHg")
    cholesterol:     float = Field(ge=100, le=600,  description="Serum cholesterol mg/dL")
    fasting_blood_sugar: int = Field(ge=0, le=1,   default=0, description="1 if >120 mg/dL")
    resting_ecg:     int   = Field(ge=0,   le=2,    default=0)
    max_heart_rate:  float = Field(ge=50,  le=220,  default=150)
    exercise_angina: int   = Field(ge=0,   le=1,    default=0)
    st_depression:   float = Field(ge=0,   le=10,   default=0.0)
    st_slope:        int   = Field(ge=0,   le=2,    default=1)


class GeneralHealthIn(BaseModel):
    age:                       int   = Field(ge=1,  le=120)
    blood_pressure_systolic:   float = Field(ge=60, le=300)
    blood_pressure_diastolic:  float = Field(ge=30, le=200)
    blood_glucose:             float = Field(ge=20, le=800)
    bmi:                       float = Field(ge=10, le=70)
    heart_rate:                Optional[float] = Field(None, ge=30, le=300)
    cholesterol:               Optional[float] = Field(None, ge=50, le=1000)


class PredictionOut(BaseModel):
    prediction_id:   Optional[str]
    prediction_type: str
    risk_level:      RiskLevel
    risk_score:      float
    confidence:      float
    recommendations: List[str]
    model_version:   str


class PredictionHistoryOut(BaseModel):
    id:          str
    type:        str
    risk_level:  RiskLevel
    risk_score:  float
    created_at:  datetime


# ─── Medical Report Schemas ──────────────────────────────────
class ReportOut(BaseModel):
    id:           str
    file_name:    str
    status:       ReportStatus
    uploaded_at:  datetime
    analyzed_at:  Optional[datetime]
    file_size:    Optional[int]


class ReportDetailOut(BaseModel):
    id:             str
    file_name:      str
    status:         ReportStatus
    ai_analysis:    Optional[str]
    extracted_data: Optional[dict]
    download_url:   Optional[str]
    uploaded_at:    datetime
    analyzed_at:    Optional[datetime]


# ─── Chatbot Schemas ─────────────────────────────────────────
class ChatMessageIn(BaseModel):
    message:    str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    session_id:    str
    response:      str
    message_count: int


class ChatSessionOut(BaseModel):
    id:            str
    title:         str
    message_count: int
    updated_at:    datetime


# ─── Notification Schemas ────────────────────────────────────
class NotificationOut(BaseModel):
    id:         str
    title:      str
    message:    str
    type:       str
    is_read:    bool
    created_at: datetime


# ─── Doctor Schemas ──────────────────────────────────────────
class DoctorProfileUpdate(BaseModel):
    specialization:   Optional[str] = None
    hospital:         Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=60)
    bio:              Optional[str] = Field(None, max_length=1000)
    consultation_fee: Optional[float] = Field(None, ge=0)
    license_number:   Optional[str] = None


# ─── Dashboard Schemas ───────────────────────────────────────
class DashboardSummary(BaseModel):
    total_records:        int
    total_reports:        int
    unread_notifications: int
    active_predictions:   int


class VitalsPoint(BaseModel):
    date:      str
    systolic:  Optional[int]
    diastolic: Optional[int]
    glucose:   Optional[float]
    heart_rate: Optional[int]


class DashboardOut(BaseModel):
    summary:            DashboardSummary
    vitals_timeline:    List[VitalsPoint]
    recent_predictions: List[Any]
    latest_vitals:      dict


# ─── Generic Responses ───────────────────────────────────────
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str
