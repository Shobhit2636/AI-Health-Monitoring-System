from fastapi import WebSocket
from typing import Dict
import json
from loguru import logger


class WebSocketManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.connections[user_id] = websocket
        logger.info(f"WebSocket connected: {user_id}")

    def disconnect(self, user_id: str):
        self.connections.pop(user_id, None)
        logger.info(f"WebSocket disconnected: {user_id}")

    async def send_personal_message(self, message: str, user_id: str):
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(user_id)

    async def send_notification(self, user_id: str, title: str, message: str, type: str = "info"):
        payload = json.dumps({"type": "notification", "title": title, "message": message, "notif_type": type})
        await self.send_personal_message(payload, user_id)

    async def broadcast(self, message: str):
        dead = []
        for uid, ws in self.connections.items():
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.disconnect(uid)


websocket_manager = WebSocketManager()
