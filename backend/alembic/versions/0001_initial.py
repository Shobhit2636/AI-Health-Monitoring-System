"""Initial migration - create all tables

Revision ID: 0001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",              sa.String(),    primary_key=True),
        sa.Column("email",           sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name",       sa.String(255), nullable=False),
        sa.Column("role",            sa.Enum("patient","doctor","admin", name="userrole"), nullable=False, server_default="patient"),
        sa.Column("is_active",       sa.Boolean(),   server_default="true"),
        sa.Column("is_verified",     sa.Boolean(),   server_default="false"),
        sa.Column("avatar_url",      sa.String(500)),
        sa.Column("phone",           sa.String(20)),
        sa.Column("date_of_birth",   sa.DateTime()),
        sa.Column("created_at",      sa.DateTime(),  server_default=sa.text("now()")),
        sa.Column("updated_at",      sa.DateTime(),  server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ── health_profiles ────────────────────────────────────────
    op.create_table(
        "health_profiles",
        sa.Column("id",                  sa.String(), primary_key=True),
        sa.Column("user_id",             sa.String(), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("age",                 sa.Integer()),
        sa.Column("gender",              sa.String(10)),
        sa.Column("height_cm",           sa.Float()),
        sa.Column("weight_kg",           sa.Float()),
        sa.Column("blood_type",          sa.String(5)),
        sa.Column("allergies",           postgresql.JSON(), server_default="[]"),
        sa.Column("chronic_conditions",  postgresql.JSON(), server_default="[]"),
        sa.Column("medications",         postgresql.JSON(), server_default="[]"),
        sa.Column("emergency_contact",   postgresql.JSON()),
        sa.Column("created_at",          sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at",          sa.DateTime(), server_default=sa.text("now()")),
    )

    # ── health_records ─────────────────────────────────────────
    op.create_table(
        "health_records",
        sa.Column("id",                       sa.String(),  primary_key=True),
        sa.Column("user_id",                  sa.String(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recorded_at",              sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("blood_pressure_systolic",  sa.Integer()),
        sa.Column("blood_pressure_diastolic", sa.Integer()),
        sa.Column("heart_rate",               sa.Integer()),
        sa.Column("blood_glucose",            sa.Float()),
        sa.Column("cholesterol_total",        sa.Float()),
        sa.Column("cholesterol_hdl",          sa.Float()),
        sa.Column("cholesterol_ldl",          sa.Float()),
        sa.Column("oxygen_saturation",        sa.Float()),
        sa.Column("temperature",              sa.Float()),
        sa.Column("hba1c",                    sa.Float()),
        sa.Column("notes",                    sa.Text()),
        sa.Column("recorded_by",              sa.String(), sa.ForeignKey("users.id")),
    )
    op.create_index("ix_health_records_user_id",    "health_records", ["user_id"])
    op.create_index("ix_health_records_recorded_at","health_records", ["recorded_at"])

    # ── health_predictions ─────────────────────────────────────
    op.create_table(
        "health_predictions",
        sa.Column("id",              sa.String(),  primary_key=True),
        sa.Column("user_id",         sa.String(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("prediction_type", sa.String(50), nullable=False),
        sa.Column("risk_level",      sa.Enum("low","moderate","high","critical", name="risklevel"), nullable=False),
        sa.Column("risk_score",      sa.Float(),   nullable=False),
        sa.Column("confidence",      sa.Float()),
        sa.Column("input_features",  postgresql.JSON()),
        sa.Column("recommendations", postgresql.JSON(), server_default="[]"),
        sa.Column("model_version",   sa.String(20), server_default="1.0.0"),
        sa.Column("created_at",      sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("ix_health_predictions_user_id", "health_predictions", ["user_id"])

    # ── medical_reports ────────────────────────────────────────
    op.create_table(
        "medical_reports",
        sa.Column("id",             sa.String(),  primary_key=True),
        sa.Column("user_id",        sa.String(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("file_name",      sa.String(255), nullable=False),
        sa.Column("s3_key",         sa.String(500), nullable=False),
        sa.Column("s3_url",         sa.String(500)),
        sa.Column("file_size",      sa.Integer()),
        sa.Column("status",         sa.Enum("pending","processing","completed","failed", name="reportstatus"), server_default="pending"),
        sa.Column("ai_analysis",    sa.Text()),
        sa.Column("extracted_data", postgresql.JSON()),
        sa.Column("report_type",    sa.String(100)),
        sa.Column("uploaded_at",    sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("analyzed_at",    sa.DateTime()),
    )
    op.create_index("ix_medical_reports_user_id", "medical_reports", ["user_id"])

    # ── doctor_profiles ────────────────────────────────────────
    op.create_table(
        "doctor_profiles",
        sa.Column("id",                sa.String(),  primary_key=True),
        sa.Column("user_id",           sa.String(),  sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("license_number",    sa.String(100), unique=True),
        sa.Column("specialization",    sa.String(100)),
        sa.Column("hospital",          sa.String(255)),
        sa.Column("experience_years",  sa.Integer()),
        sa.Column("bio",               sa.Text()),
        sa.Column("consultation_fee",  sa.Float()),
        sa.Column("available_slots",   postgresql.JSON(), server_default="[]"),
        sa.Column("verified",          sa.Boolean(), server_default="false"),
        sa.Column("rating",            sa.Float(),   server_default="0.0"),
        sa.Column("total_reviews",     sa.Integer(), server_default="0"),
    )

    # ── appointments ───────────────────────────────────────────
    op.create_table(
        "appointments",
        sa.Column("id",           sa.String(),  primary_key=True),
        sa.Column("patient_id",   sa.String(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("doctor_id",    sa.String(),  sa.ForeignKey("doctor_profiles.id"), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("status",       sa.String(20), server_default="scheduled"),
        sa.Column("notes",        sa.Text()),
        sa.Column("diagnosis",    sa.Text()),
        sa.Column("prescription", postgresql.JSON(), server_default="[]"),
        sa.Column("created_at",   sa.DateTime(), server_default=sa.text("now()")),
    )

    # ── notifications ──────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id",         sa.String(),  primary_key=True),
        sa.Column("user_id",    sa.String(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title",      sa.String(255), nullable=False),
        sa.Column("message",    sa.Text(),    nullable=False),
        sa.Column("type",       sa.String(50), server_default="info"),
        sa.Column("is_read",    sa.Boolean(),  server_default="false"),
        sa.Column("data",       postgresql.JSON()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    # ── chat_sessions ──────────────────────────────────────────
    op.create_table(
        "chat_sessions",
        sa.Column("id",         sa.String(),  primary_key=True),
        sa.Column("user_id",    sa.String(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title",      sa.String(255), server_default="Health Query"),
        sa.Column("messages",   postgresql.JSON(), server_default="[]"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("ix_chat_sessions_user_id", "chat_sessions", ["user_id"])


def downgrade() -> None:
    op.drop_table("chat_sessions")
    op.drop_table("notifications")
    op.drop_table("appointments")
    op.drop_table("doctor_profiles")
    op.drop_table("medical_reports")
    op.drop_table("health_predictions")
    op.drop_table("health_records")
    op.drop_table("health_profiles")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS risklevel")
    op.execute("DROP TYPE IF EXISTS reportstatus")
