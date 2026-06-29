import time
import uuid
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger
from app.core.redis import redis_client


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with timing and request ID."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start      = time.time()

        request.state.request_id = request_id

        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"| IP: {request.client.host if request.client else 'unknown'}"
        )

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            logger.error(f"[{request_id}] Unhandled error: {exc}")
            raise

        duration = round((time.time() - start) * 1000, 2)
        logger.info(f"[{request_id}] → {response.status_code} ({duration}ms)")

        response.headers["X-Request-ID"]    = request_id
        response.headers["X-Response-Time"] = f"{duration}ms"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple Redis-backed IP rate limiter.
    Default: 100 requests / minute per IP.
    Auth endpoints: 10 requests / minute.
    """

    LIMITS = {
        "/api/v1/auth/login":    (10,  60),
        "/api/v1/auth/register": (5,   60),
        "default":               (100, 60),
    }

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting if Redis is unavailable
        if not redis_client.client:
            return await call_next(request)

        ip   = request.client.host if request.client else "unknown"
        path = request.url.path
        max_requests, window = self.LIMITS.get(path, self.LIMITS["default"])

        key   = f"rate_limit:{ip}:{path}"
        count = await redis_client.client.get(key)

        if count and int(count) >= max_requests:
            logger.warning(f"Rate limit exceeded: {ip} → {path}")
            return JSONResponse(
                status_code=429,
                content={"detail": f"Too many requests. Limit: {max_requests}/min. Please slow down."},
                headers={"Retry-After": str(window)},
            )

        pipe = redis_client.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        await pipe.execute()

        return await call_next(request)
