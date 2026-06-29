"""
Pytest configuration and shared fixtures for tests.
"""
import asyncio
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from httpx import AsyncClient

from app.core.database import Base, get_db
from app.main import app

# Use SQLite in-memory for tests (no PostgreSQL needed for CI)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with SessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(test_db):
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def auth_headers(client):
    """Returns auth headers for a pre-registered patient."""
    reg = await client.post("/api/v1/auth/register", json={
        "email": "fixture@test.com",
        "password": "FixturePass123",
        "full_name": "Fixture User",
        "role": "patient",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def doctor_headers(client):
    """Returns auth headers for a pre-registered doctor."""
    reg = await client.post("/api/v1/auth/register", json={
        "email": "doctor@test.com",
        "password": "DoctorPass123",
        "full_name": "Dr. Fixture",
        "role": "doctor",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
