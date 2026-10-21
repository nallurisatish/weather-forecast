#!/usr/bin/env bash
set -e

echo "=== WeatherSphere Render Build Started ==="

if [ ! -f "client/dist/index.html" ]; then
  echo "Building client React application..."
  cd client
  npm install
  npm run build
  cd ..
else
  echo "Pre-built client production assets found in client/dist - skipping vite compilation"
fi

echo "Installing server production dependencies..."
cd server
npm install --production

echo "=== WeatherSphere Build Succeeded ==="
