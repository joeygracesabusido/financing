import redis.asyncio as aioredis
from ..config import settings

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Return a shared async Redis client (lazily initialized)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis():
    """Close the Redis connection (call on app shutdown)."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


# ── Convenience helpers ────────────────────────────────────────────────────────

async def cache_set(key: str, value: str, ttl_seconds: int = 300) -> None:
    r = await get_redis()
    await r.setex(key, ttl_seconds, value)


async def cache_get(key: str) -> str | None:
    r = await get_redis()
    return await r.get(key)


async def cache_delete(key: str) -> None:
    r = await get_redis()
    await r.delete(key)


async def rate_limit_check(key: str, max_requests: int, window_seconds: int) -> bool:
    """
    Simple sliding-window rate limiter.
    Returns True if the request is within the limit, False if rate-limited.
    """
    r = await get_redis()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, window_seconds)
    return current <= max_requests
