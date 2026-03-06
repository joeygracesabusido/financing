
import asyncio
from sqlalchemy import text
from app.database import get_engine

async def check_lines():
    engine = get_engine()
    async with engine.begin() as conn:
        print("\n--- Journal Lines for Entry 662 ---")
        result = await conn.execute(text("""
            SELECT id, entry_id, account_code, debit, credit, description 
            FROM journal_lines 
            WHERE entry_id = 662;
        """))
        lines = result.fetchall()
        for l in lines:
            print(f"ID: {l[0]}, EntryID: {l[1]}, Code: {l[2]}, Dr: {l[3]}, Cr: {l[4]}, Desc: {l[5]}")

if __name__ == "__main__":
    import os
    import sys
    backend_path = os.path.abspath(os.path.join(os.getcwd(), "lending-mvp", "backend"))
    if backend_path not in sys.path:
        sys.path.append(backend_path)
    asyncio.run(check_lines())
