"""
Audit middleware — logs every GraphQL POST mutation to the PostgreSQL audit_logs table.
Registered as a Starlette middleware in main.py.
"""
import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from .database.postgres import AsyncSessionLocal
from .database.pg_models import AuditLog

logger = logging.getLogger(__name__)

# GraphQL mutations to track (parsed from operation name or body)
_MUTATION_KEYWORD = "mutation"


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Intercepts POST requests to /graphql, reads the operation name,
    and writes an audit row to PostgreSQL after the response is sent.

    Notes:
    - Only mutations are logged (queries are read-only).
    - The request body is read once and cached on the request state.
    - PG errors are swallowed so they never break the API.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Only audit GraphQL POST requests
        if request.url.path != "/graphql" or request.method != "POST":
            return await call_next(request)

        # Read + cache body (Starlette body can only be read once)
        body_bytes = await request.body()

        # Monkey-patch receive so downstream can still read body
        async def receive():
            return {"type": "http.request", "body": body_bytes}

        request._receive = receive  # type: ignore[attr-defined]

        # Parse operation details before calling next
        action = "graphql_mutation"
        try:
            payload: dict[str, Any] = json.loads(body_bytes or b"{}")
            query_str: str = payload.get("query", "")
            # Only log mutations
            if _MUTATION_KEYWORD not in query_str.lower():
                return await call_next(request)
            # Extract first operation name if present
            op_name = payload.get("operationName") or _extract_operation(query_str)
            if op_name:
                action = op_name
        except Exception:
            pass

        start = time.monotonic()
        response: Response = await call_next(request)
        elapsed_ms = int((time.monotonic() - start) * 1000)

        # Write audit record asynchronously (fire-and-forget style)
        try:
            # Grab auth info from request state (set by get_context)
            user_id: str | None = None
            username: str | None = None
            role: str | None = None

            current_user = getattr(request.state, "current_user", None)
            if current_user:
                user_id = str(getattr(current_user, "id", ""))
                username = getattr(current_user, "username", None)
                role = getattr(current_user, "role", None)

            ip = _get_client_ip(request)
            status = "success" if response.status_code < 400 else "failure"
            detail = json.dumps({"elapsed_ms": elapsed_ms, "status_code": response.status_code})

            async with AsyncSessionLocal() as session:
                session.add(
                    AuditLog(
                        user_id=user_id,
                        username=username,
                        role=role,
                        action=action,
                        ip_address=ip,
                        status=status,
                        detail=detail,
                        created_at=datetime.now(timezone.utc),
                    )
                )
                await session.commit()
        except Exception as exc:
            logger.warning("AuditMiddleware: failed to write audit log — %s", exc)

        return response


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _extract_operation(query: str) -> str | None:
    """Extract the first word after 'mutation' keyword."""
    try:
        lower = query.strip().lower()
        if lower.startswith("mutation"):
            rest = query[len("mutation"):].strip()
            # Handle named mutations: "mutation CreateCustomer { ... }"
            if rest and rest[0].isalpha():
                return rest.split("{")[0].split("(")[0].strip()
    except Exception:
        pass
    return None
