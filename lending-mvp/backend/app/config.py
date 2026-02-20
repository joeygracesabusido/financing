from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── MongoDB (existing backend) ────────────────────────────────────────────
    # Legacy name kept for backward-compat with existing code that references DATABASE_URL
    DATABASE_URL: str = "mongodb://lending_mongo:27017"
    DATABASE_NAME: str = "lending_mvp"

    # Alias used by new modules
    MONGO_URL: str = "mongodb://lending_mongo:27017"
    MONGO_DB_NAME: str = "lending_mvp"

    # ── PostgreSQL (scaffolded for Phase 1 migration) ─────────────────────────
    database_url: str = "postgresql+asyncpg://lending_user:lending_secret@postgres:5432/lending_db"

    # ── Redis (cache, sessions, rate limiting) ────────────────────────────────
    redis_url: str = "redis://:lending_redis_pass@redis:6379/0"

    # ── JWT ───────────────────────────────────────────────────────────────────
    # TODO: Move secret to a true secret manager (AWS Secrets Manager, Vault) in prod
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"  # ignore unknown env vars


settings = Settings()
