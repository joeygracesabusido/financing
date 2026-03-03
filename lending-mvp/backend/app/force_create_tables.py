import asyncio
import logging
from app.database import create_tables
from app.database.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run():
    logger.info("Manually triggering table creation...")
    # Print the tables Base knows about
    logger.info(f"Base metadata knows about tables: {list(Base.metadata.tables.keys())}")
    await create_tables()
    logger.info("Table creation completed.")

if __name__ == "__main__":
    asyncio.run(run())
