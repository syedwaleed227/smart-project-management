# Production image for the Smart Accounting Suite (app server).
# Designed to run on a NAS (Synology Container Manager / QNAP Container Station)
# alongside a PostgreSQL container — see docker-compose.nas.yml.
FROM node:20-slim AS base
# Prisma needs openssl present in the slim image.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies (kept full — the entrypoint uses prisma + tsx at startup).
COPY package.json package-lock.json ./
RUN npm ci

# Build the app.
COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# On start: apply DB schema, ensure an admin user exists, then run the app.
CMD ["/usr/local/bin/entrypoint.sh"]
