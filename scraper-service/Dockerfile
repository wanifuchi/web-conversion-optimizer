# Puppeteer Scraper Service Dockerfile
FROM node:18-alpine

# Install dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configure Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy app source
COPY src ./src

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S scraper -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R scraper:nodejs /app
USER scraper

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node src/health.js || exit 1

# Start the application
CMD ["node", "src/server.js"]