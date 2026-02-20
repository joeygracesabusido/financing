"""
Simple test to verify pytest setup works.
"""

import pytest
import asyncio


@pytest.mark.asyncio
async def test_simple():
    """A simple test to verify pytest-asyncio is working."""
    await asyncio.sleep(0.1)
    assert True
