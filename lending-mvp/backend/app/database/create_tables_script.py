import asyncio
from app.database.postgres import engine
from app.database import Base

async def create_all():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print('Tables created!')

asyncio.run(create_all())