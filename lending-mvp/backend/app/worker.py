"""
ARQ background worker for Phase 1 async tasks.
Start with: arq app.worker.WorkerSettings
"""
import os
import logging
from arq import cron
from arq.connections import RedisSettings

logger = logging.getLogger(__name__)


# ── Task definitions ──────────────────────────────────────────────────────────

async def generate_loan_statement(ctx, loan_id: str, user_id: str):
    """
    Placeholder: generate PDF loan statement and store/email it.
    - ctx['redis'] gives the shared Redis connection
    """
    logger.info("generate_loan_statement | loan_id=%s user_id=%s", loan_id, user_id)
    # TODO: fetch loan, render PDF, upload to MinIO/S3, send email via SendGrid
    await ctx["redis"].set(
        f"statement:status:{loan_id}",
        "generated",
        ex=86400,
    )
    return {"status": "ok", "loan_id": loan_id}


async def send_notification(ctx, user_id: str, message: str, channel: str = "email"):
    """
    Placeholder: send notification via email / SMS / push.
    """
    logger.info("send_notification | user=%s channel=%s", user_id, channel)
    # TODO: integrate SendGrid / Twilio
    return {"status": "queued", "channel": channel}


async def accrue_daily_interest(ctx):
    """
    Daily cron: compute and post interest for all savings accounts.
    """
    logger.info("accrue_daily_interest | running")
    # TODO: iterate savings accounts, compute interest, write ledger entry
    return {"status": "done"}


# ── Worker settings ───────────────────────────────────────────────────────────

_redis_url = os.getenv("REDIS_URL", "redis://:lending_redis_pass@redis:6379/0")

# Parse password from URL for RedisSettings if present
def _parse_redis_settings(url: str) -> RedisSettings:
    """Convert redis://[:password@]host:port/db to arq RedisSettings."""
    # e.g. redis://:pass@host:6379/0
    url = url.replace("redis://", "")
    password = None
    if "@" in url:
        credentials, hostpart = url.rsplit("@", 1)
        password = credentials.lstrip(":")
    else:
        hostpart = url

    # strip db
    if "/" in hostpart:
        hostpart, _ = hostpart.rsplit("/", 1)

    host, port = hostpart.rsplit(":", 1)
    return RedisSettings(host=host, port=int(port), password=password)


class WorkerSettings:
    functions = [generate_loan_statement, send_notification]
    cron_jobs = [
        cron(accrue_daily_interest, hour=0, minute=0),  # midnight UTC daily
    ]
    redis_settings = _parse_redis_settings(_redis_url)
    max_jobs = 10
    job_timeout = 300
    on_startup = None
    on_shutdown = None
