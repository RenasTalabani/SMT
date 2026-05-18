# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S citygym -u 1001

# Copy deps + source
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=citygym:nodejs . .

# Create required directories
RUN mkdir -p logs uploads && chown -R citygym:nodejs logs uploads

USER citygym

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
