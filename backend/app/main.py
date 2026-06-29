from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis import redis_client
from app.api.v1.router import api_router
from app.core.websocket import websocket_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Health Ecosystem...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await redis_client.connect()
    logger.info("DB tables created. Server ready!")
    yield
    await redis_client.disconnect()

app = FastAPI(
    title="AI Health Monitoring Ecosystem",
    description="Production-ready AI-powered healthcare platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.send_personal_message(data, user_id)
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Health Ecosystem", "db": "sqlite", "mode": "sandbox"}

@app.exception_handler(404)
async def not_found(req, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})
