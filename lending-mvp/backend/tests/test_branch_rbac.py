"""
Branch RBAC Integration Tests
=================================
Tests for branch-scoped access control:
  - loan_officer cannot see cross-branch customers
  - branch_manager can only access own branch loans
  - teller restricted to own branch  
  - admin sees all
  - auditor sees all (read-only)

These are unit-style tests using pytest-asyncio and a mocked MongoDB context.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Helpers to build user mocks
# ---------------------------------------------------------------------------
def make_user(role: str, branch_code: str | None = None):
    user = MagicMock()
    user.role = role
    user.branch_code = branch_code
    user.id = "507f1f77bcf86cd799439011"
    user.username = f"test_{role}"
    return user


# ---------------------------------------------------------------------------
# Tests for auth/rbac.py helpers
# ---------------------------------------------------------------------------
class TestRBACHelpers:
    def test_get_mongo_branch_filter_admin_returns_empty(self):
        from app.auth.rbac import get_mongo_branch_filter
        user = make_user("admin", "HQ")
        assert get_mongo_branch_filter(user) == {}

    def test_get_mongo_branch_filter_auditor_returns_empty(self):
        from app.auth.rbac import get_mongo_branch_filter
        user = make_user("auditor", "HQ")
        assert get_mongo_branch_filter(user) == {}

    def test_get_mongo_branch_filter_loan_officer_scoped(self):
        from app.auth.rbac import get_mongo_branch_filter
        user = make_user("loan_officer", "BR-QC")
        assert get_mongo_branch_filter(user) == {"branch_code": "BR-QC"}

    def test_get_mongo_branch_filter_branch_manager_scoped(self):
        from app.auth.rbac import get_mongo_branch_filter
        user = make_user("branch_manager", "BR-CDO")
        assert get_mongo_branch_filter(user) == {"branch_code": "BR-CDO"}

    def test_get_mongo_branch_filter_teller_scoped(self):
        from app.auth.rbac import get_mongo_branch_filter
        user = make_user("teller", "HQ")
        assert get_mongo_branch_filter(user) == {"branch_code": "HQ"}

    def test_get_mongo_branch_filter_unassigned_user_blocks_access(self):
        from app.auth.rbac import get_mongo_branch_filter
        user = make_user("loan_officer", None)  # no branch assigned
        result = get_mongo_branch_filter(user)
        # Should return an impossible filter, not an empty one
        assert result != {}
        assert "branch_code" in result

    def test_get_sql_branch_filter_admin_returns_none(self):
        from app.auth.rbac import get_sql_branch_filter
        user = make_user("admin", "HQ")
        assert get_sql_branch_filter(user) is None

    def test_get_sql_branch_filter_auditor_returns_none(self):
        from app.auth.rbac import get_sql_branch_filter
        user = make_user("auditor", "HQ")
        assert get_sql_branch_filter(user) is None

    def test_get_sql_branch_filter_loan_officer_returns_code(self):
        from app.auth.rbac import get_sql_branch_filter
        user = make_user("loan_officer", "BR-QC")
        assert get_sql_branch_filter(user) == "BR-QC"


class TestBranchAccessAssertion:
    def test_admin_can_access_any_branch(self):
        from app.auth.rbac import assert_branch_access
        user = make_user("admin", "HQ")
        # Should not raise
        assert_branch_access(user, "BR-QC")
        assert_branch_access(user, "BR-CDO")

    def test_auditor_can_access_any_branch(self):
        from app.auth.rbac import assert_branch_access
        user = make_user("auditor", "HQ")
        assert_branch_access(user, "BR-QC")  # Should not raise

    def test_loan_officer_can_access_own_branch(self):
        from app.auth.rbac import assert_branch_access
        user = make_user("loan_officer", "BR-QC")
        assert_branch_access(user, "BR-QC")  # Should not raise

    def test_loan_officer_cannot_access_other_branch(self):
        from app.auth.rbac import assert_branch_access
        from fastapi import HTTPException
        user = make_user("loan_officer", "BR-QC")
        with pytest.raises(HTTPException) as exc_info:
            assert_branch_access(user, "BR-CDO")
        assert exc_info.value.status_code == 403

    def test_teller_cannot_access_other_branch(self):
        from app.auth.rbac import assert_branch_access
        from fastapi import HTTPException
        user = make_user("teller", "HQ")
        with pytest.raises(HTTPException) as exc_info:
            assert_branch_access(user, "BR-QC")
        assert exc_info.value.status_code == 403

    def test_branch_manager_cannot_access_other_branch(self):
        from app.auth.rbac import assert_branch_access
        from fastapi import HTTPException
        user = make_user("branch_manager", "BR-QC")
        with pytest.raises(HTTPException) as exc_info:
            assert_branch_access(user, "HQ")
        assert exc_info.value.status_code == 403


class TestTellerBranchValidation:
    def test_teller_cash_drawer_own_branch_allowed(self):
        from app.auth.rbac import assert_own_branch_teller
        user = make_user("teller", "BR-CDO")
        # Should not raise
        assert_own_branch_teller(user, "BR-CDO")

    def test_teller_cash_drawer_other_branch_blocked(self):
        from app.auth.rbac import assert_own_branch_teller
        from fastapi import HTTPException
        user = make_user("teller", "BR-CDO")
        with pytest.raises(HTTPException) as exc_info:
            assert_own_branch_teller(user, "HQ")
        assert exc_info.value.status_code == 403

    def test_admin_cash_drawer_any_branch_allowed(self):
        from app.auth.rbac import assert_own_branch_teller
        user = make_user("admin", "HQ")
        # Admin can open any branch drawer
        assert_own_branch_teller(user, "BR-CDO")  # Should not raise


class TestRequireRoles:
    def test_require_roles_passes_for_correct_role(self):
        from app.auth.rbac import require_roles
        info = MagicMock()
        info.context = {"current_user": make_user("admin", "HQ")}
        user = require_roles(info, "admin", "branch_manager")
        assert user.role == "admin"

    def test_require_roles_raises_for_wrong_role(self):
        from app.auth.rbac import require_roles
        from fastapi import HTTPException
        info = MagicMock()
        info.context = {"current_user": make_user("teller", "HQ")}
        with pytest.raises(HTTPException) as exc_info:
            require_roles(info, "admin", "branch_manager")
        assert exc_info.value.status_code == 403

    def test_require_authenticated_raises_when_no_user(self):
        from app.auth.rbac import require_authenticated
        from fastapi import HTTPException
        info = MagicMock()
        info.context = {"current_user": None}
        with pytest.raises(HTTPException) as exc_info:
            require_authenticated(info)
        assert exc_info.value.status_code == 401
