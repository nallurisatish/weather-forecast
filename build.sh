#!/usr/bin/env bash
set -e

echo "=== WeatherSphere Render Build Started ==="

echo "1/3 Installing Client Dependencies..."
cd client
npm install

echo "2/3 Building Client Production Assets..."
npm run build

echo "3/3 Installing Server Dependencies..."
cd ../server
npm install

echo "=== WeatherSphere Build Succeeded ==="
