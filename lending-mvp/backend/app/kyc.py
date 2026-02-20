"""
KYC Workflow GraphQL module.
Documents stored on disk (configurable), metadata in PostgreSQL.
Backed by SQLAlchemy Phase 1 tables.
"""
import base64
import json
import mimetypes
import os
from datetime import datetime, timezone
from typing import List, Optional

import aiofiles
import strawberry
from sqlalchemy import select
from strawberry.types import Info

from .config import settings
from .database.pg_models import KYCDocument, CustomerActivity
from .database.postgres import AsyncSessionLocal


# allowed MIME types
_ALLOWED_MIME = {
    "image/jpeg", "image/png", "image/webp",
    "application/pdf",
}


# ── GraphQL Types ─────────────────────────────────────────────────────────────

@strawberry.type
class KYCDocumentType:
    id: int
    customer_id: str = strawberry.field(name="customerId")
    doc_type: str = strawberry.field(name="docType")
    file_name: str = strawberry.field(name="fileName")
    file_size_bytes: Optional[int] = strawberry.field(name="fileSizeBytes", default=None)
    mime_type: Optional[str] = strawberry.field(name="mimeType", default=None)
    status: str
    reviewed_by: Optional[str] = strawberry.field(name="reviewedBy", default=None)
    reviewed_at: Optional[datetime] = strawberry.field(name="reviewedAt", default=None)
    rejection_reason: Optional[str] = strawberry.field(name="rejectionReason", default=None)
    expires_at: Optional[datetime] = strawberry.field(name="expiresAt", default=None)
    uploaded_at: datetime = strawberry.field(name="uploadedAt")


@strawberry.input
class KYCUploadInput:
    customer_id: str
    doc_type: str          # "government_id" | "proof_of_address" | "income_proof"
    file_name: str
    file_base64: str       # base64-encoded file content
    mime_type: Optional[str] = None
    expires_at: Optional[datetime] = None


@strawberry.type
class KYCDocumentResponse:
    success: bool
    message: str
    document: Optional[KYCDocumentType] = None
    risk_score: Optional[float] = strawberry.field(name="riskScore", default=None)


@strawberry.type
class KYCDocumentsResponse:
    success: bool
    message: str
    documents: List[KYCDocumentType]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_type(row: KYCDocument) -> KYCDocumentType:
    return KYCDocumentType(
        id=row.id,
        customer_id=row.customer_id,
        doc_type=row.doc_type,
        file_name=row.file_name,
        file_size_bytes=row.file_size_bytes,
        mime_type=row.mime_type,
        status=row.status,
        reviewed_by=row.reviewed_by,
        reviewed_at=row.reviewed_at,
        rejection_reason=row.rejection_reason,
        expires_at=row.expires_at,
        uploaded_at=row.uploaded_at,
    )


def _compute_risk_score(docs: list[KYCDocument]) -> float:
    """
    Simple heuristic risk score (0 = lowest risk, 100 = highest risk).
    Score decreases as more verified docs are on file.
    - All 3 doc types verified → 5 (low risk)
    - 2 verified → 25
    - 1 verified → 50
    - 0 verified → 80
    - Any rejected → +15 penalty, capped at 100
    Industry note: replace with ML model in Phase 6.
    """
    verified = [d for d in docs if d.status == "verified"]
    rejected = [d for d in docs if d.status == "rejected"]
    base = {3: 5, 2: 25, 1: 50}.get(len(verified), 80)
    penalty = min(len(rejected) * 15, 15)
    return float(min(base + penalty, 100))


async def _log_activity(session, customer_id: str, action: str, actor_id: str, actor_username: str, detail: dict):
    session.add(CustomerActivity(
        customer_id=customer_id,
        actor_user_id=actor_id,
        actor_username=actor_username,
        action=action,
        detail=json.dumps(detail),
        created_at=datetime.now(timezone.utc),
    ))


# ── Query ─────────────────────────────────────────────────────────────────────

@strawberry.type
class KYCQuery:
    @strawberry.field
    async def kyc_documents(self, info: Info, customer_id: str) -> KYCDocumentsResponse:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Not authenticated")
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(KYCDocument)
                .where(KYCDocument.customer_id == customer_id)
                .order_by(KYCDocument.uploaded_at.desc())
            )
            docs = result.scalars().all()
        return KYCDocumentsResponse(success=True, message="OK", documents=[_row_to_type(d) for d in docs])


# ── Mutation ──────────────────────────────────────────────────────────────────

@strawberry.type
class KYCMutation:
    @strawberry.field
    async def upload_kyc_document(self, info: Info, input: KYCUploadInput) -> KYCDocumentResponse:
        """Upload a KYC document (base64). Returns updated risk score."""
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Not authenticated")

        # Decode base64
        try:
            file_bytes = base64.b64decode(input.file_base64)
        except Exception:
            return KYCDocumentResponse(success=False, message="Invalid base64 file content")

        # Validate MIME / size (max 5 MB)
        mime = input.mime_type or mimetypes.guess_type(input.file_name)[0] or "application/octet-stream"
        if mime not in _ALLOWED_MIME:
            return KYCDocumentResponse(success=False, message=f"Unsupported file type: {mime}")
        if len(file_bytes) > 5 * 1024 * 1024:
            return KYCDocumentResponse(success=False, message="File too large (max 5 MB)")

        # Save file
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        safe_name = f"{input.customer_id}_{input.doc_type}_{input.file_name}".replace("/", "_")
        file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_bytes)

        async with AsyncSessionLocal() as session:
            doc = KYCDocument(
                customer_id=input.customer_id,
                doc_type=input.doc_type,
                file_name=input.file_name,
                file_path=file_path,
                file_size_bytes=len(file_bytes),
                mime_type=mime,
                status="pending",
                expires_at=input.expires_at,
                uploaded_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(doc)
            await _log_activity(
                session,
                input.customer_id,
                "kyc_submitted",
                str(current_user.id),
                current_user.username,
                {"doc_type": input.doc_type, "file_name": input.file_name},
            )
            await session.commit()
            await session.refresh(doc)

            # Compute risk score from all docs
            result = await session.execute(
                select(KYCDocument).where(KYCDocument.customer_id == input.customer_id)
            )
            all_docs = result.scalars().all()
            risk_score = _compute_risk_score(list(all_docs))

        return KYCDocumentResponse(success=True, message="Document uploaded", document=_row_to_type(doc), risk_score=risk_score)

    @strawberry.field
    async def update_kyc_status(
        self,
        info: Info,
        document_id: int,
        status: str,
        rejection_reason: Optional[str] = None,
    ) -> KYCDocumentResponse:
        """Update KYC document status. Admin or loan_officer only."""
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Not authenticated")
        if current_user.role not in ("admin", "loan_officer"):
            raise Exception("Not authorized")

        if status not in ("pending", "verified", "rejected"):
            return KYCDocumentResponse(success=False, message="Invalid status")

        async with AsyncSessionLocal() as session:
            doc = await session.get(KYCDocument, document_id)
            if not doc:
                return KYCDocumentResponse(success=False, message="Document not found")
            doc.status = status
            doc.reviewed_by = str(current_user.id)
            doc.reviewed_at = datetime.now(timezone.utc)
            doc.updated_at = datetime.now(timezone.utc)
            if status == "rejected" and rejection_reason:
                doc.rejection_reason = rejection_reason
            await _log_activity(
                session,
                doc.customer_id,
                f"kyc_{status}",
                str(current_user.id),
                current_user.username,
                {"document_id": document_id, "status": status},
            )
            await session.commit()
            await session.refresh(doc)

            result = await session.execute(
                select(KYCDocument).where(KYCDocument.customer_id == doc.customer_id)
            )
            all_docs = result.scalars().all()
            risk_score = _compute_risk_score(list(all_docs))

            # ── Sync kyc_status to MongoDB customer record ────────────────
            has_verified = any(d.status == "verified" for d in all_docs)
            has_any_submitted = len(all_docs) > 0
            if has_verified:
                new_kyc_status = "verified"
            elif status == "rejected" and not has_verified:
                new_kyc_status = "rejected"
            else:
                new_kyc_status = "submitted"

            try:
                from .database import get_customers_collection
                from bson import ObjectId
                customers_col = get_customers_collection()
                await customers_col.update_one(
                    {"_id": ObjectId(doc.customer_id)},
                    {"$set": {"kyc_status": new_kyc_status, "risk_score": risk_score}},
                )
            except Exception:
                pass  # Non-fatal: log would appear in AuditMiddleware

        return KYCDocumentResponse(success=True, message=f"Document {status}", document=_row_to_type(doc), risk_score=risk_score)

