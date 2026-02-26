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
    - Fetches all active savings accounts with interest rates
    - Computes daily interest using: daily_rate = annual_rate / 365
    - Posts interest to ledger via accounting_service
    - Updates account balance
    """
    logger.info("accrue_daily_interest | running")
    
    try:
        from datetime import date
        from decimal import Decimal
        
        from app.database import get_savings_collection
        from app.database.savings_crud import SavingsCRUD
        from app.services.accounting_service import post_transaction
        
        savings_collection = get_savings_collection()
        savings_crud = SavingsCRUD(savings_collection)
        
        # Get all active savings accounts
        accounts = await savings_crud.get_all_savings_accounts()
        
        interest_accounts_processed = 0
        total_interest_posted = Decimal("0.00")
        
        for account in accounts:
            # Only process accounts with interest rates and active status
            if not hasattr(account, 'interest_rate') or account.interest_rate is None:
                continue
            if account.status != "active":
                continue
            
            account_id = str(account.id)
            balance = Decimal(str(account.balance))
            annual_rate = Decimal(str(account.interest_rate))
            
            # Calculate daily interest rate (annual rate / 365)
            daily_rate = annual_rate / Decimal("365")
            
            # Calculate daily interest
            daily_interest = (balance * daily_rate) / Decimal("100")
            
            if daily_interest <= 0:
                continue
            
            # Update account balance
            success = await savings_crud.update_balance(account_id, daily_interest)
            
            if success:
                interest_accounts_processed += 1
                total_interest_posted += daily_interest
                
                # Post to ledger: Debit Interest Expense, Credit Interest Payable
                # Using standard GL accounts (you can customize these based on your chart of accounts)
                debit_account = "5600"  # Interest Expense
                credit_account = "2200"  # Interest Payable
                
                await post_transaction(debit_account, credit_account, daily_interest)
                
                logger.info(
                    "Daily interest posted | account=%s interest=%.2f balance=%.2f",
                    account_id, float(daily_interest), float(balance + daily_interest)
                )
        
        logger.info(
            "accrue_daily_interest | completed | accounts_processed=%d total_interest=%.2f",
            interest_accounts_processed, float(total_interest_posted)
        )
        
        return {
            "status": "success",
            "accounts_processed": interest_accounts_processed,
            "total_interest_posted": str(total_interest_posted)
        }
        
    except Exception as e:
        logger.error("accrue_daily_interest | error: %s", str(e))
        return {"status": "error", "message": str(e)}


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
