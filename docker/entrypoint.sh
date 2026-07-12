#!/bin/sh
set -e

echo "==> Checking dependencies..."
if [ ! -d node_modules ]; then
  echo "==> node_modules not found, installing..."
  npm ci
fi

echo "==> Starting Vite dev server..."
exec npm run dev -- --host 0.0.0.0 --port 5174
