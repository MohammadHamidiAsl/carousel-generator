# ─── Simple Multi-Architecture Dockerfile using System Chromium ─────────
FROM node:18-slim

# Install system dependencies including Chromium and available Persian fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    chromium \
    # Font configuration tools
    fontconfig \
    # Available fonts for Persian/Farsi text rendering
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    fonts-noto \
    fonts-noto-core \
    fonts-noto-ui-core \
    # Available Persian/Arabic fonts in Debian
    fonts-farsiweb \
    fonts-droid-fallback \
    fonts-kacst \
    fonts-kacst-one \
    # Additional Unicode support
    fonts-dejavu \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    # RTL language support dependencies
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
    libxfixes3 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    xdg-utils \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean up dev dependencies
RUN npm prune --production

# Create non-root user
RUN groupadd -r nodegroup && useradd -r -g nodegroup -m nodeuser && \
    chown -R nodeuser:nodegroup /app

# Copy startup script
COPY start-app.sh /usr/local/bin/start-app.sh
RUN chmod +x /usr/local/bin/start-app.sh

# Switch to non-root user
USER nodeuser

# Environment variables
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=15s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:3000/api/generate || exit 1

CMD ["/usr/local/bin/start-app.sh"]