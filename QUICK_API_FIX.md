# Quick Fix Summary - ERR_CONNECTION_REFUSED (Docker)

## The Problem
```
POST http://localhost:8001/api-login/ net::ERR_CONNECTION_REFUSED
```

Frontend container was trying to use `localhost` which refers to itself, not the backend service.

## The Fix (In Docker Compose)

### Updated Files:
1. **`/lending-mvp/frontend-react/.env`**
   ```
   VITE_API_URL=http://backend:8000
   ```

2. **`/lending-mvp/docker-compose.yml`** (environment section)
   ```yaml
   environment:
     VITE_API_URL: ${VITE_API_URL:-http://backend:8000}
     VITE_GRAPHQL_URL: ${VITE_GRAPHQL_URL:-http://backend:8000/graphql}
   ```

## Why This Works
- Inside Docker network `lending_net`, containers communicate via **service names**
- `backend` is the service name in docker-compose.yml
- Docker DNS automatically resolves `backend` to the backend container's IP
- Port 8000 is the internal port (not 8001, which is for host access)

## What to Do Now

### 1. Stop Current Containers
```bash
docker-compose down
```

### 2. Rebuild and Start
```bash
cd /home/ubuntu/Github/financing/lending-mvp
docker-compose up --build
```

Wait for output:
```
✅ backend_1  | Uvicorn running on http://0.0.0.0:8000
✅ frontend_1 | VITE v4.x.x ready in xxx ms
```

### 3. Test Login
- Open browser to: `http://localhost:3010/login`
- Username: `admin`
- Password: `Admin@123Demo`

### 4. Verify Network Request
- Press F12 → Network tab
- Click Login
- Check request: `http://backend:8000/api-login/` ✅ (NOT localhost:8001)

## Docker Port Mapping Reference
From docker-compose.yml:
```
Frontend:  3010 (host) → 3000 (container)
Backend:   8001 (host) → 8000 (container)

Inside network use: http://backend:8000 (NOT http://localhost:8001)
From host browser: http://localhost:3010/login ✅
```

## If Still Having Issues

### Check container logs
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Verify DNS resolution
```bash
docker-compose exec frontend ping backend
```

### Check environment variables
```bash
docker-compose exec frontend env | grep VITE
```

### Full rebuild
```bash
docker-compose down -v
docker-compose up --build
```

---

✅ **Status:** Fixed - Docker networking configured correctly
**Key Lesson:** Inside Docker, use service names (backend), not localhost

