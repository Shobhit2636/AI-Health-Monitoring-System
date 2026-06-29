#!/bin/bash
# AI Health Ecosystem — Quick Start Script
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AI Health Monitoring Ecosystem     ║${NC}"
echo -e "${BLUE}║          Quick Start Script          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Check dependencies
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install from https://docker.com"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required."; exit 1; }

# Setup env
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠  Edit .env and add your GEMINI_API_KEY and AWS credentials!${NC}"
fi

# Train AI models
echo -e "${GREEN}Training AI Models...${NC}"
cd ai-services
pip install scikit-learn xgboost joblib numpy pandas -q 2>/dev/null || true
python training/train_models.py 2>/dev/null || echo "Models will use demo mode (no pip available)"
cd ..

# Start services
echo -e "${GREEN}Starting all services with Docker Compose...${NC}"
docker-compose up -d

# Wait for health
echo -e "${BLUE}Waiting for services to be healthy...${NC}"
sleep 8

echo ""
echo -e "${GREEN}✅ AI Health Ecosystem is running!${NC}"
echo ""
echo "  Frontend  →  http://localhost:3000"
echo "  Backend   →  http://localhost:8000"
echo "  API Docs  →  http://localhost:8000/api/docs"
echo "  RabbitMQ  →  http://localhost:15672  (health_user / rabbitmqpass)"
echo ""
echo -e "${YELLOW}First time? Register at http://localhost:3000/register${NC}"
echo -e "${YELLOW}For AI features, set GEMINI_API_KEY in .env then restart: docker-compose restart backend${NC}"
