# ─── Builder stage ───────────────────────────────────────────────────────
FROM node:18-slim AS builder
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy source & build
COPY . .
RUN npm run build

# ─── Runner stage ────────────────────────────────────────────────────────
FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libxss1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Copy over only what's needed at runtime
COPY --from=builder /app/.next       ./.next
COPY --from=builder /app/public      ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./
# (if you use next.config.ts, uncomment the next line)
# COPY --from=builder /app/next.config.ts ./

# Expose and run
EXPOSE 3000
CMD ["npm", "start"]
