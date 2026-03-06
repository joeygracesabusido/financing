
import asyncio
from sqlalchemy import text
from app.database import get_engine

async def check_journal():
    engine = get_engine()
    async with engine.begin() as conn:
        print("\n--- Recent Journal Entries ---")
        result = await conn.execute(text("""
            SELECT id, reference_no, description, timestamp 
            FROM journal_entries 
            ORDER BY timestamp DESC 
            LIMIT 10;
        """))
        entries = result.fetchall()
        for e in entries:
            print(f"ID: {e[0]}, Ref: {e[1]}, Desc: {e[2]}, Date: {e[3]}")
            
        print("\n--- Recent Journal Lines ---")
        result = await conn.execute(text("""
            SELECT id, entry_id, account_code, debit, credit, description 
            FROM journal_lines 
            ORDER BY id DESC 
            LIMIT 20;
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
    asyncio.run(check_journal())
