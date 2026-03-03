import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool, create_engine
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ── Import our models so metadata is populated ────────────────────────────────
# NOTE: We don't import models here to avoid import issues with Alembic
# The migrations define the schema manually using op.create_table()
# import sys
# sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
# from app.database.pg_models import Base
# import app.database.pg_core_models  # Users, Customers, Transactions
# import app.database.pg_loan_models
# import app.database.pg_accounting_models

# Instead, use an empty metadata that Alembic will populate from migrations
from sqlalchemy import MetaData
target_metadata = MetaData()

# ── Alembic config ────────────────────────────────────────────────────────────
config = context.config

# Override sqlalchemy.url from environment (used in Docker)
pg_url = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://lending_user:lending_secret@postgres:5432/lending_db",
)
# Use sync psycopg2 for Alembic (Alembic uses sync engine for migrations)
sync_url = pg_url.replace("postgresql+asyncpg://", "postgresql://")
config.set_main_option("sqlalchemy.url", sync_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Use empty metadata since we're using declarative migrations
# target_metadata = Base.metadata


# ── Offline migrations ────────────────────────────────────────────────────────
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online migrations (sync) ─────────────────────────────────────────────────
def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with sync psycopg2."""
    url = config.get_main_option("sqlalchemy.url")
    connectable = create_engine(url, echo=False)
    with connectable.connect() as connection:
        do_run_migrations(connection)
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
