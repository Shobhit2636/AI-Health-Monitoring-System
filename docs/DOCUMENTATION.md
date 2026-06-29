# AI Health Monitoring Ecosystem — Complete Documentation

## Table of Contents
1. [Architecture Overview](#architecture)
2. [Setup & Installation](#setup)
3. [Environment Variables](#env-vars)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [AI Models](#ai-models)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview {#architecture}

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend (3000)               │
│  Dashboard │ Predictions │ Reports │ Chat │ Portal   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────┐
│              Nginx Reverse Proxy (80/443)            │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│           FastAPI Backend (8000)                     │
│  JWT Auth │ RBAC │ Rate Limiting │ Logging           │
├──────────────┬────────────┬────────────┬────────────┤
│  PostgreSQL  │   Redis    │  RabbitMQ  │  AWS S3    │
│  (Database)  │  (Cache)   │  (Queue)   │ (Storage)  │
└──────────────┴────────────┴─────┬──────┴────────────┘
                                  │
                     ┌────────────▼────────────┐
                     │     AI Services          │
                     │  XGBoost │ Gemini API   │
                     └──────────────────────────┘
```

---

## 2. Setup & Installation {#setup}

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Quick Start (Docker)
```bash
# 1. Clone repository
git clone <your-repo-url>
cd ai-health-ecosystem

# 2. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 3. Train AI models (optional — uses demo mode if skipped)
cd ai-services
pip install scikit-learn xgboost joblib numpy pandas
python training/train_models.py
cd ..

# 4. Start everything
bash start.sh
```

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head          # Run migrations
uvicorn app.main:app --reload  # Start server

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 3. Environment Variables {#env-vars}

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ | JWT signing key (min 32 chars) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `RABBITMQ_URL` | ✅ | RabbitMQ connection string |
| `GEMINI_API_KEY` | ⚠️ | Google Gemini API key (AI features) |
| `AWS_ACCESS_KEY_ID` | ⚠️ | AWS credentials (S3 storage) |
| `AWS_SECRET_ACCESS_KEY` | ⚠️ | AWS credentials |
| `AWS_S3_BUCKET` | ⚠️ | S3 bucket name |
| `SMTP_USER` | ⚪ | Gmail address (email notifications) |
| `SMTP_PASSWORD` | ⚪ | Gmail app password |

✅ Required | ⚠️ Required for full AI/storage | ⚪ Optional

---

## 4. API Reference {#api-reference}

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET  | `/api/v1/auth/me` | Get current user |

### Health Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/health/records` | Add vitals record |
| GET  | `/api/v1/health/records` | List records (last 30) |

### AI Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/predictions/diabetes` | Diabetes risk prediction |
| POST | `/api/v1/predictions/heart-disease` | Heart disease risk |
| POST | `/api/v1/predictions/general-health` | Overall health risk |
| GET  | `/api/v1/predictions/history` | Prediction history |

### Medical Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reports/upload` | Upload PDF (multipart) |
| GET  | `/api/v1/reports/` | List all reports |
| GET  | `/api/v1/reports/{id}` | Get report + AI analysis |

### AI Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chatbot/message` | Send message to HealthBot |
| GET  | `/api/v1/chatbot/sessions` | List chat sessions |
| GET  | `/api/v1/chatbot/sessions/{id}` | Get session messages |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/patient` | Patient dashboard data |
| GET | `/api/v1/dashboard/admin` | Admin overview (admin only) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/` | List notifications |
| PUT | `/api/v1/notifications/{id}/read` | Mark as read |
| PUT | `/api/v1/notifications/read-all` | Mark all read |

### User Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/profile` | Get full profile + health data |
| PUT | `/api/v1/users/profile` | Update profile |

### Doctor Portal (doctor/admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/doctor/patients` | List all patients |
| GET | `/api/v1/doctor/patients/{id}/records` | Patient's health records |

### Admin Portal (admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | All users |
| PUT | `/api/v1/admin/users/{id}/toggle-active` | Activate/deactivate user |
| GET | `/api/v1/admin/stats` | System statistics |

### WebSocket
```
ws://localhost:8000/ws/{user_id}
```
Real-time notifications pushed as JSON:
```json
{ "type": "notification", "title": "...", "message": "...", "notif_type": "success" }
```

---

## 5. Database Schema {#database-schema}

```
users
  ├── id (PK), email, hashed_password, full_name
  ├── role (patient|doctor|admin)
  ├── is_active, is_verified, phone, avatar_url
  └── created_at, updated_at

health_profiles (1:1 with users)
  ├── age, gender, height_cm, weight_kg, blood_type
  ├── allergies[], chronic_conditions[], medications[] (JSON)
  └── emergency_contact (JSON)

health_records (many per user)
  ├── blood_pressure_systolic/diastolic, heart_rate
  ├── blood_glucose, cholesterol_total/hdl/ldl
  ├── oxygen_saturation, temperature, hba1c
  └── notes, recorded_by

health_predictions (many per user)
  ├── prediction_type, risk_level, risk_score, confidence
  ├── input_features (JSON), recommendations (JSON)
  └── model_version

medical_reports (many per user)
  ├── file_name, s3_key, s3_url, file_size
  ├── status (pending|processing|completed|failed)
  ├── ai_analysis (TEXT), extracted_data (JSON)
  └── uploaded_at, analyzed_at

doctor_profiles (1:1 with users of role=doctor)
  ├── license_number, specialization, hospital
  ├── experience_years, bio, consultation_fee
  └── verified, rating, total_reviews

appointments
  ├── patient_id, doctor_id, scheduled_at, status
  ├── notes, diagnosis
  └── prescription (JSON)

notifications
  ├── title, message, type (info|warning|alert|success)
  └── is_read, data (JSON)

chat_sessions
  ├── title
  └── messages (JSON array of {role, content})
```

---

## 6. AI Models {#ai-models}

### Diabetes Prediction
- **Algorithm**: XGBoost Classifier
- **Features**: glucose, BMI, age, blood pressure, pregnancies, insulin, diabetes pedigree
- **Dataset**: Pima Indians Diabetes Dataset
- **AUC**: ~0.85

### Heart Disease Prediction
- **Algorithm**: XGBoost Classifier
- **Features**: age, sex, chest pain type, BP, cholesterol, ECG, max heart rate, exercise angina
- **Dataset**: Cleveland Heart Disease Dataset
- **AUC**: ~0.89

### General Health Risk
- **Algorithm**: Rule-based scoring with weighted risk factors
- **Features**: BP, glucose, BMI, age, heart rate, cholesterol

### AI Report Analysis & Chatbot
- **Model**: Google Gemini 1.5 Pro
- **Report Analysis**: Extracts text from PDF → structured health summary
- **Chatbot**: Context-aware health Q&A with patient history

### Training Models
```bash
cd ai-services
python training/train_models.py
# Output: ai-services/models/diabetes_model.pkl
#         ai-services/models/heart_model.pkl
```

---

## 7. Deployment {#deployment}

### Production Docker Compose
```bash
# Set production env
export ENVIRONMENT=production
export SECRET_KEY=$(openssl rand -hex 32)

# Start
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# View logs
docker-compose logs -f backend
```

### GitHub Actions CI/CD
Push to `main` branch triggers:
1. Backend tests (pytest with PostgreSQL)
2. Frontend TypeScript check + build
3. Docker image build & push to GHCR
4. SSH deploy to production server

Required GitHub Secrets:
- `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`
- `GEMINI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 8. Testing {#testing}

```bash
cd backend

# Install test deps
pip install pytest pytest-asyncio httpx aiosqlite

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_ai_services.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

Test files:
- `tests/test_auth.py` — Basic health check
- `tests/test_api.py` — Full API integration tests
- `tests/test_ai_services.py` — AI model unit tests
- `tests/conftest.py` — Shared fixtures (in-memory SQLite)

---

## 9. Troubleshooting {#troubleshooting}

### Common Issues

**Q: AI predictions always return same result**  
A: Models not trained. Run `python ai-services/training/train_models.py`

**Q: Report analysis says "Demo mode"**  
A: Add `GEMINI_API_KEY` to `.env` and restart backend

**Q: S3 upload fails**  
A: Check AWS credentials in `.env` and ensure S3 bucket exists with correct region

**Q: Database connection error**  
A: Ensure PostgreSQL is running: `docker-compose up -d postgres`

**Q: Redis connection refused**  
A: Ensure Redis is running: `docker-compose up -d redis`

**Q: Email notifications not working**  
A: Configure `SMTP_USER` and `SMTP_PASSWORD` in `.env`

**Q: WebSocket not connecting**  
A: Check `VITE_WS_URL` in frontend `.env` matches backend URL
