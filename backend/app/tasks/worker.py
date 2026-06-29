import asyncio, json
from loguru import logger
from app.core.config import settings

async def main():
    logger.info("Worker started.")
    try:
        import aio_pika
        conn = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        async with conn:
            ch = await conn.channel()
            q  = await ch.declare_queue("health_jobs", durable=True)
            async with q.iterator() as qi:
                async for msg in qi:
                    async with msg.process():
                        body = json.loads(msg.body.decode())
                        logger.info(f"Job: {body.get('type')}")
    except Exception as e:
        logger.warning(f"Worker fallback mode: {e}")
        while True: await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())
