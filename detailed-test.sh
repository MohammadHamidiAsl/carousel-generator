#!/bin/bash

echo "🔍 Detailed API Test"
echo "==================="

echo "1️⃣ Basic connectivity test:"
curl -s http://localhost:3000 > /dev/null && echo "✅ Port 3000 accessible" || echo "❌ Port 3000 not accessible"

echo ""
echo "2️⃣ Health endpoint test:"
health_response=$(curl -s http://localhost:3000/api/generate 2>/dev/null || echo "failed")
echo "Health response: $health_response"

echo ""
echo "3️⃣ Simple test with verbose output:"
echo "Sending simple POST request..."

curl -v -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"pages":[{"type":"cover","title":"Simple Test"}]}' \
  --max-time 30 \
  2>&1 | head -20

echo ""
echo "4️⃣ Container logs (last 15 lines):"
docker-compose logs --tail=15 web

echo ""
echo "5️⃣ Container process check:"
docker-compose exec web ps aux | grep -E "(node|npm|chrome)"
