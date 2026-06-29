import json
from typing import Any, Optional
from loguru import logger

class RedisClient:
    """Stub Redis client - uses in-memory dict for sandbox"""
    def __init__(self):
        self.client = None
        self._store: dict = {}

    async def connect(self):
        try:
            import redis.asyncio as aioredis
            self.client = await aioredis.from_url(
                "redis://localhost:6379/0",
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=1,
            )
            await self.client.ping()
            logger.info("Redis connected.")
        except Exception as e:
            logger.warning(f"Redis not available ({e}). Using in-memory cache.")
            self.client = None

    async def disconnect(self):
        if self.client:
            try:
                await self.client.close()
            except:
                pass

    async def get(self, key: str) -> Optional[Any]:
        if self.client:
            try:
                v = await self.client.get(key)
                return json.loads(v) if v else None
            except:
                pass
        return self._store.get(key)

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        if self.client:
            try:
                await self.client.setex(key, ttl, json.dumps(value))
                return True
            except:
                pass
        self._store[key] = value
        return True

    async def delete(self, key: str) -> bool:
        self._store.pop(key, None)
        if self.client:
            try:
                await self.client.delete(key)
            except:
                pass
        return True

    async def delete_pattern(self, pattern: str) -> int:
        keys = [k for k in self._store if k.startswith(pattern.replace("*", ""))]
        for k in keys:
            del self._store[k]
        return len(keys)

    def cache_key(self, prefix: str, *args) -> str:
        return f"{prefix}:{':'.join(str(a) for a in args)}"

redis_client = RedisClient()
