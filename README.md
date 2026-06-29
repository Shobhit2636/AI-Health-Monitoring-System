# AI Health Monitoring Ecosystem

Production-ready AI-powered healthcare platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Chart.js |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Queue | RabbitMQ 3 |
| AI/ML | Scikit-Learn, XGBoost, Gemini API |
| Storage | AWS S3 |
| DevOps | Docker, GitHub Actions |

## Quick Start

```bash
# Clone and setup
git clone <repo>
cd ai-health-ecosystem

# Start all services
docker-compose up -d

# Frontend dev server
cd frontend && npm install && npm run dev

# Backend dev server
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Architecture

```
React Frontend (Port 3000)
        ↓
FastAPI Backend (Port 8000)
    ↓        ↓
PostgreSQL   Redis (Cache)
             ↓
          RabbitMQ (Jobs)
             ↓
        AI Services (Gemini / XGBoost)
             ↓
           AWS S3
```

## Features

- JWT Authentication + RBAC (Patient / Doctor / Admin)
- Health Risk Prediction (Diabetes, Heart Disease)
- Medical Report Upload + AI Analysis (Gemini)
- AI Health Assistant Chatbot
- Real-time Notifications (WebSocket)
- Doctor Portal + Admin Portal
- Health Dashboard with Charts
- Background job processing
- Redis caching
- Full Docker deployment
- CI/CD with GitHub Actions
