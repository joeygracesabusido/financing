# Docker Network Configuration Fix - ERR_CONNECTION_REFUSED

## Problem
The frontend Docker container was trying to connect to `http://localhost:8001/api-login/` which fails because:
- `localhost` inside a container refers to the **container itself**, not the host
- The backend service is accessible via the **service name** `backend` on the Docker network

## Root Cause
When running in Docker Compose, containers communicate via a bridge network (`lending_net`). Using `localhost` or `127.0.0.1` breaks this because it points to the container itself, not the host or other services.

## Docker Compose Architecture
```
┌─────────────────────────────────────────┐
│         Docker Host (Your Machine)      │
│  Port 3010 ←────┐  Port 8001 ←────┐    │
└────────┼────────┼──────────────────┼────┘
         │        │                  │
    ┌────▼────────┴──────────────────┴────┐
    │  lending_net (Bridge Network)       │
    │  ┌──────────────┐  ┌──────────────┐ │
    │  │   frontend   │  │   backend    │ │
    │  │ :3000        │  │   :8000      │ │
    │  │              │  │              │ │
    │  │ (Vite Dev)   │  │ (FastAPI)    │ │
    │  └──────────────┘  └──────────────┘ │
    │         ↓                   ↑        │
    │    fetch to http://backend:8000     │
    └─────────────────────────────────────┘

KEY: Inside the network, use 'backend' (service name), NOT 'localhost'
```

## Solution Applied

### 1. Updated Frontend Environment Files

#### `.env` (Docker)
```
VITE_API_URL=http://backend:8000
```

#### `.env.local` (Docker)
```
VITE_API_URL=http://backend:8000
VITE_GRAPHQL_URL=http://backend:8000/graphql
```

#### `.env.example` (Documentation)
Includes both Docker and local development examples.

### 2. Updated `docker-compose.yml`

**Before:**
```yaml
environment:
  VITE_API_URL: ${VITE_API_URL:-http://localhost:8001/graphql}
  VITE_GRAPHQL_URL: ${VITE_GRAPHQL_URL:-http://localhost:8001}
```

**After:**
```yaml
environment:
  VITE_API_URL: ${VITE_API_URL:-http://backend:8000}
  VITE_GRAPHQL_URL: ${VITE_GRAPHQL_URL:-http://backend:8000/graphql}
```

## How Docker Network URLs Work

### ❌ WRONG: Using localhost in Docker
```
Browser on Host: http://localhost:3010  ✅ Works (maps to 0.0.0.0:3010)
Inside Frontend Container: http://localhost:8001  ❌ FAILS (refers to frontend container, not host)
```

### ✅ CORRECT: Using service names in Docker
```
Frontend to Backend inside lending_net: http://backend:8000  ✅ Works
(Docker DNS resolves 'backend' to the backend service IP on the network)
```

### Port Mapping Reference
From `docker-compose.yml`:
```yaml
backend:
  ports:
    - "8001:8000"          # HOST:CONTAINER
    # 8001 on your machine ↔ 8000 inside container
    
frontend:
  ports:
    - "3010:3000"          # HOST:CONTAINER
    # 3010 on your machine ↔ 3000 inside container
```

## Testing the Docker Setup

### Step 1: Verify Docker Compose Setup
```bash
cd /home/ubuntu/Github/financing/lending-mvp

# Show the network configuration
docker-compose config | grep -A 20 "lending_net"

# Verify service names
docker-compose config | grep "container_name:"
```

Expected output:
```
lending_frontend
lending_backend
lending_postgres
lending_redis
lending_mongo
```

### Step 2: Start Docker Compose
```bash
# From /lending-mvp directory
docker-compose up --build

# Or in background:
docker-compose up -d --build
```

Wait for all services to be healthy:
```
✅ postgres_1    | database system is ready to accept connections
✅ redis_1       | Ready to accept connections
✅ mongodb_1     | Waiting for connections
✅ backend_1     | Uvicorn running on http://0.0.0.0:8000
✅ frontend_1    | VITE v4.x.x  ready in xxx ms
```

### Step 3: Verify Container Network Communication
```bash
# Check if frontend can reach backend service
docker-compose exec frontend curl -v http://backend:8000/docs

# Should return 200 OK with HTML GraphQL documentation
```

### Step 4: Test Frontend at Host Browser
Open your browser to:
- **Frontend:** `http://localhost:3010/login`
- **Backend GraphQL:** `http://localhost:8001/graphql`

### Step 5: Test Login with Demo Credentials
1. Navigate to `http://localhost:3010/login`
2. Enter credentials:
   - **Username:** `admin`
   - **Password:** `Admin@123Demo`
3. Click Login
4. Check browser DevTools (F12) → Network tab:
   - Request should go to `http://backend:8000/api-login/`
   - Response status: `200 OK` ✅

### Step 6: Verify Network Communication
```bash
# List all running containers on lending_net
docker-compose ps

# Output example:
# NAME              COMMAND                  SERVICE   STATUS
# lending_backend   "python -m uvicorn..."   backend   Up (healthy)
# lending_frontend  "npm run dev"            frontend  Up
```

## Debugging Docker Networking Issues

### Check If Containers Are on Same Network
```bash
docker network inspect lending-mvp_lending_net
```

Should show both `frontend` and `backend` with their network IPs.

### Test Service Discovery (DNS)
```bash
# From inside frontend container
docker-compose exec frontend ping backend

# Should resolve to internal IP like 172.20.0.4
```

### Check Frontend Environment Variables Inside Container
```bash
docker-compose exec frontend env | grep VITE
```

Should show:
```
VITE_API_URL=http://backend:8000
VITE_GRAPHQL_URL=http://backend:8000/graphql
```

### View Container Logs
```bash
# Frontend logs
docker-compose logs -f frontend

# Backend logs
docker-compose logs -f backend

# All logs
docker-compose logs -f
```

### Rebuild and Restart
If issues persist:
```bash
# Stop all containers
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v

# Rebuild and restart
docker-compose up --build
```

## Environment Variable Resolution Order

When docker-compose starts the frontend container, it resolves `VITE_API_URL` as follows:

1. **Check `.env` in `/lending-mvp` directory** (if exists)
2. **Fall back to `docker-compose.yml` environment defaults**

So if you have `/lending-mvp/.env`:
```
VITE_API_URL=http://backend:8000
```

This will override the compose file settings.

## Key Differences: Docker vs Local Development

| Setting | Docker | Local (Non-Docker) |
|---------|--------|-------------------|
| Frontend Port | 3000 (internal), 3010 (host) | 3000 or higher |
| Backend Port | 8000 (internal), 8001 (host) | 8000 or custom |
| API URL in Frontend | `http://backend:8000` | `http://localhost:8000` |
| Database Connection | Service names | localhost/127.0.0.1 |
| Network | Docker bridge | localhost/network |

## Files Updated
- ✅ `/lending-mvp/frontend-react/.env` → `http://backend:8000`
- ✅ `/lending-mvp/frontend-react/.env.local` → `http://backend:8000`
- ✅ `/lending-mvp/frontend-react/.env.example` → Both Docker and local examples
- ✅ `/lending-mvp/docker-compose.yml` → Environment defaults updated

## Docker Compose Command Reference
```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Execute command in running container
docker-compose exec frontend sh

# Check service status
docker-compose ps
```

## Important Notes

1. **Service Names are DNS Records**: Docker Compose automatically creates DNS entries for service names on the bridge network. `backend` resolves to the backend service's network IP.

2. **Port Mapping Only for Host Access**: The `ports` directive in docker-compose.yml only maps to the host. Inside the network, you must use the container port (8000, not 8001).

3. **Environment Variable Persistence**: After updating `.env` or `docker-compose.yml`, you may need to rebuild:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

4. **No localhost Inside Container**: This is a common Docker gotcha. `localhost` always refers to the container itself:
   - ✅ `http://backend:8000` - Correct (service name)
   - ❌ `http://localhost:8000` - Wrong (refers to frontend container's localhost)
   - ❌ `http://127.0.0.1:8000` - Wrong (same as localhost)

5. **CORS Configuration**: The backend already has CORS enabled. If you still see CORS errors:
   ```bash
   # Verify backend CORS settings
   docker-compose exec backend grep -r "cors" /app/app/
   ```

---

**Status:** ✅ Fixed - Docker networking configured correctly
**Last Updated:** 2026-02-20
**Environment:** Docker Compose with bridge network `lending_net`
