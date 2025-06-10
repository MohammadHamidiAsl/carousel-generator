#!/bin/bash

echo "🧪 Simple Carousel Generator Test"
echo "================================="

# Detect architecture
ARCH=$(uname -m)
echo "🖥️  Host: $ARCH"

# Stop and rebuild
echo "🔄 Rebuilding container..."
docker-compose down
docker system prune -f

# Build with verbose output
echo "🏗️  Building (this may take a few minutes)..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful, starting container..."
docker-compose up -d

echo "⏳ Waiting for startup (60 seconds)..."
sleep 60

echo ""
echo "📋 Container Info:"
docker-compose exec web bash -c '
echo "Container arch: $(dpkg --print-architecture)"
echo "System browsers:"
ls -la /usr/bin/*chrom* 2>/dev/null || echo "No system browsers found"
echo ""
echo "Browser test:"
chromium --version 2>/dev/null || echo "Chromium version check failed"
'

echo ""
echo "🔌 API Test:"
response=$(timeout 30s curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"pages":[{"type":"cover","title":"Test"}]}' 2>/dev/null || echo "failed")

if echo "$response" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Image generation working"
    echo "$response" | head -c 200
    echo "..."
else
    echo "❌ FAILED"
    echo "Response: $response"
    echo ""
    echo "📋 Logs:"
    docker-compose logs --tail=10 web
fi

echo ""
echo "📊 Container Status:"
docker-compose ps
