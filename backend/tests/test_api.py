"""
Full Backend Test Suite
Tests: Auth, Health Records, AI Predictions, Reports, Chatbot, Notifications
Run: pytest tests/ -v
"""
import pytest
import json
from httpx import AsyncClient
from app.main import app


# ─── Fixtures ────────────────────────────────────────────────
@pytest.fixture
def patient_data():
    return {
        "email":     "patient@test.com",
        "password":  "TestPass123",
        "full_name": "Test Patient",
        "role":      "patient",
        "phone":     "+91-9876543210",
    }

@pytest.fixture
def doctor_data():
    return {
        "email":     "doctor@test.com",
        "password":  "DoctorPass123",
        "full_name": "Dr. Test Doctor",
        "role":      "doctor",
    }

@pytest.fixture
def admin_data():
    return {
        "email":     "admin@test.com",
        "password":  "AdminPass123",
        "full_name": "Test Admin",
        "role":      "admin",
    }


# ─── Health Check ────────────────────────────────────────────
class TestHealthCheck:
    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            r = await client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert "service" in data

    @pytest.mark.asyncio
    async def test_api_docs_accessible(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            r = await client.get("/api/docs")
        assert r.status_code == 200


# ─── Authentication Tests ─────────────────────────────────────
class TestAuth:
    @pytest.mark.asyncio
    async def test_register_patient(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            r = await client.post("/api/v1/auth/register", json=patient_data)
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == patient_data["email"]
        assert data["user"]["role"] == "patient"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/v1/auth/register", json=patient_data)
            r = await client.post("/api/v1/auth/register", json=patient_data)
        assert r.status_code == 400
        assert "already registered" in r.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_success(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/v1/auth/register", json=patient_data)
            r = await client.post("/api/v1/auth/login", json={
                "email": patient_data["email"],
                "password": patient_data["password"],
            })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/v1/auth/register", json=patient_data)
            r = await client.post("/api/v1/auth/login", json={
                "email": patient_data["email"],
                "password": "wrongpassword",
            })
        assert r.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            reg = await client.post("/api/v1/auth/register", json=patient_data)
            token = reg.json()["access_token"]
            r = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == patient_data["email"]

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            r = await client.get("/api/v1/auth/me")
        assert r.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            r = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer invalid_token_here"}
            )
        assert r.status_code == 401


# ─── Health Records Tests ─────────────────────────────────────
class TestHealthRecords:
    async def _get_token(self, client, data):
        r = await client.post("/api/v1/auth/register", json=data)
        if r.status_code != 201:
            r = await client.post("/api/v1/auth/login", json={"email": data["email"], "password": data["password"]})
        return r.json()["access_token"]

    @pytest.mark.asyncio
    async def test_create_health_record(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            token = await self._get_token(client, patient_data)
            headers = {"Authorization": f"Bearer {token}"}
            r = await client.post("/api/v1/health/records", json={
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 80,
                "heart_rate": 72,
                "blood_glucose": 95.5,
                "oxygen_saturation": 98.0,
                "notes": "Feeling good today",
            }, headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert "recorded_at" in data

    @pytest.mark.asyncio
    async def test_list_health_records(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            token = await self._get_token(client, patient_data)
            headers = {"Authorization": f"Bearer {token}"}
            # Create 2 records
            await client.post("/api/v1/health/records", json={"heart_rate": 70}, headers=headers)
            await client.post("/api/v1/health/records", json={"heart_rate": 75}, headers=headers)
            r = await client.get("/api/v1/health/records", headers=headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 2

    @pytest.mark.asyncio
    async def test_health_record_requires_auth(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            r = await client.get("/api/v1/health/records")
        assert r.status_code in (401, 403)


# ─── AI Prediction Tests ──────────────────────────────────────
class TestPredictions:
    async def _get_token(self, client, data):
        r = await client.post("/api/v1/auth/register", json=data)
        if r.status_code != 201:
            r = await client.post("/api/v1/auth/login", json={"email": data["email"], "password": data["password"]})
        return r.json()["access_token"]

    @pytest.mark.asyncio
    async def test_diabetes_prediction(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            token = await self._get_token(client, patient_data)
            r = await client.post("/api/v1/predictions/diabetes", json={
                "glucose": 145,
                "bmi": 32.5,
                "age": 45,
                "blood_pressure": 85,
                "pregnancies": 2,
            }, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "risk_score"       in data
        assert "risk_level"       in data
        assert "recommendations"  in data
        assert data["risk_level"] in ("low", "moderate", "high", "critical")
        assert 0.0 <= data["risk_score"] <= 1.0

    @pytest.mark.asyncio
    async def test_heart_disease_prediction(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            token = await self._get_token(client, patient_data)
            r = await client.post("/api/v1/predictions/heart-disease", json={
                "age": 58,
                "sex": 1,
                "chest_pain_type": 2,
                "resting_bp": 145,
                "cholesterol": 265,
                "max_heart_rate": 138,
                "exercise_angina": 1,
            }, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "risk_score"  in data
        assert "risk_level"  in data
        assert "prediction_type" in data
        assert data["prediction_type"] == "heart_disease"

    @pytest.mark.asyncio
    async def test_general_health_prediction(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            token = await self._get_token(client, patient_data)
            r = await client.post("/api/v1/predictions/general-health", json={
                "age": 35,
                "blood_pressure_systolic": 125,
                "blood_pressure_diastolic": 82,
                "blood_glucose": 98,
                "bmi": 24.5,
            }, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["prediction_type"] == "general_health"

    @pytest.mark.asyncio
    async def test_prediction_history(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            token = await self._get_token(client, patient_data)
            headers = {"Authorization": f"Bearer {token}"}
            await client.post("/api/v1/predictions/diabetes", json={
                "glucose": 130, "bmi": 28, "age": 40, "blood_pressure": 78,
            }, headers=headers)
            r = await client.get("/api/v1/predictions/history", headers=headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    @pytest.mark.asyncio
    async def test_prediction_validation(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            token = await self._get_token(client, patient_data)
            # Missing required fields
            r = await client.post("/api/v1/predictions/diabetes", json={
                "glucose": 150,  # missing bmi, age, blood_pressure
            }, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code in (400, 422)


# ─── Dashboard Tests ──────────────────────────────────────────
class TestDashboard:
    @pytest.mark.asyncio
    async def test_patient_dashboard(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            reg = await client.post("/api/v1/auth/register", json=patient_data)
            token = reg.json()["access_token"]
            r = await client.get(
                "/api/v1/dashboard/patient",
                headers={"Authorization": f"Bearer {token}"}
            )
        assert r.status_code == 200
        data = r.json()
        assert "summary"            in data
        assert "vitals_timeline"    in data
        assert "recent_predictions" in data


# ─── RBAC Tests ───────────────────────────────────────────────
class TestRBAC:
    @pytest.mark.asyncio
    async def test_patient_cannot_access_admin(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            reg = await client.post("/api/v1/auth/register", json=patient_data)
            token = reg.json()["access_token"]
            r = await client.get(
                "/api/v1/admin/users",
                headers={"Authorization": f"Bearer {token}"}
            )
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_patient_cannot_access_doctor_portal(self, patient_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            reg = await client.post("/api/v1/auth/register", json=patient_data)
            token = reg.json()["access_token"]
            r = await client.get(
                "/api/v1/doctor/patients",
                headers={"Authorization": f"Bearer {token}"}
            )
        assert r.status_code == 403
