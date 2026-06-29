-- AI Health Ecosystem — Initial Database Setup
-- Runs automatically on first PostgreSQL container start

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for text search

-- Indexes will be auto-created by SQLAlchemy, but we add some performance ones here

-- After SQLAlchemy creates tables, these indexes improve query performance
-- (These are advisory — SQLAlchemy migration will handle the actual table creation)

-- Function to update 'updated_at' timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Seed data will be inserted by the application on first run
-- (Admin user is created via /api/v1/auth/register with role=admin)

COMMENT ON DATABASE health_db IS 'AI Health Monitoring Ecosystem Database';
