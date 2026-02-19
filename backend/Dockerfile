FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Security: drop privileges
RUN addgroup -S kavach && adduser -S kavach -G kavach
USER kavach

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "index.js"]
