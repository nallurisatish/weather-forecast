#!/usr/bin/env bash
set -e

echo "=== WeatherSphere Render Build Started ==="

# Temporarily unset or override NODE_ENV so all build tools (like vite) install
export NODE_ENV=development

echo "1/3 Installing Client Dependencies..."
cd client
npm install --include=dev

echo "2/3 Building Client Production Assets with Vite..."
npm run build

echo "3/3 Installing Server Dependencies..."
cd ../server
npm install

echo "=== WeatherSphere Build Succeeded ==="
