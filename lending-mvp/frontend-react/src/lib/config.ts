// Add cache buster to bust browser cache on code changes
const CACHE_BUSTER = Date.now().toString(36)
export const API_URL = (globalThis as any).VITE_API_URL || `http://localhost:8001?cb=${CACHE_BUSTER}`
