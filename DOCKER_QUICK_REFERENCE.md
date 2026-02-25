# Docker Network Fix - Quick Reference Card

## The Issue
```
POST http://localhost:8001/api-login/ net::ERR_CONNECTION_REFUSED
```
Frontend container tried to use `localhost` which refers to itself, not the backend.

---

## The Solution

### ✅ What Was Fixed
1. **`.env`** → `VITE_API_URL=http://backend:8000`
2. **`docker-compose.yml`** → Updated environment defaults to use `http://backend:8000`
3. **`.env.local` & `.env.example`** → Added Docker and local examples

### ✅ Why It Works
Inside the `lending_net` Docker bridge network:
- Service names are DNS records (e.g., `backend` resolves to backend container)
- Internal container port is `8000` (not `8001`)
- `localhost` inside a container = the container itself (❌ wrong)
- Service name `backend` = the backend service (✅ correct)

---

## Quick Start

### 1. Build and Start Docker Compose
```bash
cd /home/ubuntu/Github/financing/lending-mvp
docker-compose down  # stop any running containers
docker-compose up --build
```

### 2. Wait for Services to Be Healthy
```
✅ postgres    | database system is ready
✅ redis       | Ready to accept connections  
✅ mongodb     | Waiting for connections
✅ backend     | Uvicorn running on http://0.0.0.0:8000
✅ frontend    | VITE v4.x.x ready in xxx ms
```

### 3. Test Login
- Open `http://localhost:3010/login`
- Username: `admin`
- Password: `Admin@123Demo`
- Should succeed ✅

---

## Reference Table

| Component | Internal | Host | Docker URL | Browser URL |
|-----------|----------|------|-----------|------------|
| Frontend | 3000 | 3010 | http://frontend:3000 | http://localhost:3010 |
| Backend | 8000 | 8001 | http://backend:8000 | http://localhost:8001 |

**Key:** Inside Docker network, use the Internal column (service names).
From your browser, use the Browser URL column (localhost + host port).

---

## Docker Network Diagram

```
YOUR COMPUTER
│
├─ http://localhost:3010 ───→ Frontend Container (port 3000)
│                               │
├─ http://localhost:8001 ───→ Backend Container (port 8000)
│
       INSIDE CONTAINER NETWORK (lending_net)
       ├─ http://backend:8000 ───→ Backend Service
       └─ http://frontend:3000 ──→ Frontend Service
```

---

## Common Commands

```bash
# Start services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Execute command in container
docker-compose exec frontend sh

# Check health
docker-compose ps

# Clean rebuild (removes volumes)
docker-compose down -v && docker-compose up --build
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| ERR_CONNECTION_REFUSED | Containers not running or wrong URL. Check `docker-compose ps` |
| Can't access http://localhost:3010 | Frontend not started. Check logs: `docker-compose logs frontend` |
| Login fails with "Invalid credentials" | Demo data not seeded or GraphQL schema fix not applied |
| DNS resolution error in frontend | Check network: `docker-compose exec frontend ping backend` |
| Changes not taking effect | Rebuild containers: `docker-compose down && docker-compose up --build` |

---

## Files Modified
- ✅ `/lending-mvp/frontend-react/.env`
- ✅ `/lending-mvp/frontend-react/.env.local`
- ✅ `/lending-mvp/frontend-react/.env.example`
- ✅ `/lending-mvp/docker-compose.yml`

---

**Status:** ✅ Complete - Ready for testing
**Key Learning:** Docker service names (backend) replace localhost in containerized environments
