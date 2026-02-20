from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Numeric,
    String,
    Text,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.orm import relationship

from .pg_models import Base

# ---------------------------------------------------------------------------
# General Ledger Accounts
# ---------------------------------------------------------------------------
class GLAccount(Base):
    __tablename__ = "gl_accounts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # "asset" | "liability" | "equity" | "income" | "expense"
    
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ---------------------------------------------------------------------------
# Journal Entries
# ---------------------------------------------------------------------------
class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reference_no = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(String(64), nullable=True) # mongo user id
    
    lines = relationship("JournalLine", back_populates="entry", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Journal Lines (Double-entry)
# ---------------------------------------------------------------------------
class JournalLine(Base):
    __tablename__ = "journal_lines"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    entry_id = Column(BigInteger, ForeignKey("journal_entries.id"), nullable=False, index=True)
    entry = relationship("JournalEntry", back_populates="lines")
    
    account_code = Column(String(50), ForeignKey("gl_accounts.code"), nullable=False, index=True)
    account = relationship("GLAccount")
    
    debit = Column(Numeric(14, 2), nullable=False, default=0)
    credit = Column(Numeric(14, 2), nullable=False, default=0)
    
    description = Column(Text, nullable=True)
