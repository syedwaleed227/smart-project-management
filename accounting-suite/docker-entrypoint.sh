#!/bin/sh
# Startup sequence for the app container.
set -e

echo "[entrypoint] Applying database schema..."
n=0
until npx prisma db push --skip-generate; do
  n=$((n + 1))
  if [ "$n" -ge 12 ]; then
    echo "[entrypoint] Database not reachable after several attempts — exiting."
    exit 1
  fi
  echo "[entrypoint] Database not ready yet, retrying in 3s... ($n/12)"
  sleep 3
done

echo "[entrypoint] Ensuring an initial admin account exists..."
# Creates the first admin from ADMIN_* env vars ONLY if there are no users yet.
# It never touches existing data, so it is safe to run on every start.
npx tsx prisma/bootstrap.ts || echo "[entrypoint] Bootstrap step skipped/failed (continuing)."

echo "[entrypoint] Starting web app on port ${PORT:-3000}..."
exec npm run start
