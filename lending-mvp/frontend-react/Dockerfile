# ── Stage 1: Development ──────────────────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source (dev: volume-mounted at runtime, so this is just for build context)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ── Stage 2: Production build ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 3: Production serve (nginx) ────────────────────────────────────────
FROM nginx:stable-alpine AS prod

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
