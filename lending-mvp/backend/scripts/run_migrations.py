#!/usr/bin/env python
"""
Migration runner script for PostgreSQL database.
Runs all pending Alembic migrations before starting the application.
"""

import asyncio
import os
import sys
import logging
from pathlib import Path

# Setup logging BEFORE importing anything that uses settings
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FIX: Use local variable for Alembic; do not overwrite DATABASE_URL so other scripts get async URL
database_url = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://lending_user:lending_secret@postgres:5432/lending_db"
)
alembic_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
logger.info(f"🔄 Using database URL for migrations: {alembic_url.split('@')[1] if '@' in alembic_url else 'unknown'}")

# NOW add backend to path and import
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic.config import Config
from alembic import command
from sqlalchemy import inspect, text, create_engine


async def check_database_connection(database_url: str, max_retries: int = 30) -> bool:
    """
    Check if the database is ready and accessible.
    Retries with exponential backoff.
    Uses sync engine for checking since we already converted URL to psycopg2.
    """
    from sqlalchemy import create_engine, text
    
    try:
        # Create sync engine for connection testing (using psycopg2 URL)
        sync_engine = create_engine(database_url, echo=False)
        for attempt in range(max_retries):
            try:
                with sync_engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                    logger.info("✅ Database connection successful")
                    sync_engine.dispose()
                    return True
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = min(2 ** attempt, 10)  # Exponential backoff, max 10s
                    logger.warning(f"⏳ Database not ready (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"❌ Database connection failed after {max_retries} attempts: {e}")
                    sync_engine.dispose()
                    return False
        return False
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}", exc_info=True)
        return False


def run_migrations():
    """
    Run Alembic migrations.
    """
    try:
        # Get the database URL from environment
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://lending_user:lending_secret@postgres:5432/lending_db"
        )
        
        # Replace asyncpg with psycopg2 for Alembic (Alembic doesn't support async drivers for migration)
        alembic_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
        
        logger.info(f"🔄 Starting database migrations...")
        logger.info(f"   Database: {alembic_url.split('@')[1] if '@' in alembic_url else 'unknown'}")
        
        # Create Alembic config
        alembic_cfg = Config(Path(__file__).parent.parent / "alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", alembic_url)
        
        # Check current revision
        from alembic.script import ScriptDirectory
        script = ScriptDirectory.from_config(alembic_cfg)
        logger.info(f"📝 Available migrations: {[rev.revision for rev in script.walk_revisions()]}")
        
        # Run migrations - this will NOT raise an exception on success
        logger.info("   Running: alembic upgrade head")
        try:
            # Capture detailed debug info
            result = command.upgrade(alembic_cfg, "head")
            logger.info(f"✅ Migrations completed successfully! (Result: {result})")
            return True
        except Exception as e:
            logger.error(f"❌ Alembic upgrade failed: {e}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        return False


def main():
    """
    Main entry point: check DB connection, then run migrations.
    """
    try:
        # Get database URL (keep async form in env; use sync form for connection check)
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://lending_user:lending_secret@postgres:5432/lending_db"
        )
        sync_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
        
        # Step 1: Wait for database to be ready (async)
        logger.info("🔍 Checking database connection...")
        loop = asyncio.get_event_loop()
        if not loop.run_until_complete(check_database_connection(sync_url)):
            logger.error("❌ Failed to connect to database")
            raise Exception("Database connection failed")
        
        # Step 2: Run migrations
        logger.info("📦 Running Alembic migrations...")
        if not run_migrations():
            logger.error("❌ Migrations failed")
            raise Exception("Migrations failed")
        
        logger.info("✅ All checks passed! Database is ready.")
        return 0
        
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    # Do NOT use sys.exit() - let this script return normally
    # Docker will handle exit codes
    exit_code = main()
    # Print final message
    if exit_code == 0:
        print("\n✅ Migration script completed successfully")
    else:
        print(f"\n❌ Migration script failed with code {exit_code}")
    # Exit normally - return the exit code but don't sys.exit()
    # This allows the entrypoint to continue to uvicorn
