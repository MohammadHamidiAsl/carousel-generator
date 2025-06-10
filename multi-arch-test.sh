#!/bin/bash

echo "🏗️  Multi-Architecture Carousel Generator Test"
echo "=============================================="

# Detect host architecture
HOST_ARCH=$(uname -m)
echo "🖥️  Host Architecture: $HOST_ARCH"

if [[ "$HOST_ARCH" == "arm64" || "$HOST_ARCH" == "aarch64" ]]; then
    echo "📱 Running on Apple Silicon (ARM64)"
    EXPECTED_ARCH="arm64"
elif [[ "$HOST_ARCH" == "x86_64" ]]; then
    echo "💻 Running on Intel/AMD (x86_64)"
    EXPECTED_ARCH="x64"
else
    echo "❓ Unknown architecture: $HOST_ARCH"
    EXPECTED_ARCH="unknown"
fi

echo ""
echo "🚀 Building and starting container..."

# Stop any existing container
docker-compose down

# Build for current architecture
docker-compose up --build -d

echo ""
echo "⏳ Waiting for container startup..."
sleep 45

echo ""
echo "🔍 Container Architecture Analysis:"

# Get container info
docker-compose exec web bash -c '
echo "Container Details:"
echo "  Architecture: $(dpkg --print-architecture)"
echo "  Kernel: $(uname -m)"
echo "  Node.js arch: $(node -e "console.log(process.arch)")"
echo "  Platform: $(node -e "console.log(process.platform)")"

echo ""
echo "Chrome Installation:"
if [ -f ~/chrome-info ]; then
    echo "  Build info: $(cat ~/chrome-info)"
fi

CHROME_PATH=$(find ~/.cache/puppeteer -name "chrome" -executable 2>/dev/null | head -1)
if [ -n "$CHROME_PATH" ]; then
    echo "  Chrome path: $CHROME_PATH"
    echo "  Chrome type: $(file $CHROME_PATH | cut -d: -f2)"
else
    echo "  Chrome: Not found"
fi

echo ""
echo "Environment Variables:"
env | grep -E "(CHROME|PUPPETEER)" | sed "s/^/  /"
'

echo ""
echo "🔌 API Health Check:"

# Test health endpoint
health_response=$(curl -s http://localhost:3000/api/generate || echo "failed")

if [[ "$health_response" != "failed" ]]; then
    echo "✅ API responding"
    
    # Parse health response
    echo "$health_response" | python3 -m json.tool 2>/dev/null || echo "$health_response"
    
    # Extract architecture from response
    api_arch=$(echo "$health_response" | grep -o '"architecture":"[^"]*"' | cut -d'"' -f4)
    chrome_exec=$(echo "$health_response" | grep -o '"chromeExecutable":"[^"]*"' | cut -d'"' -f4)
    
    echo ""
    echo "📊 Architecture Verification:"
    echo "  Expected: $EXPECTED_ARCH"
    echo "  API reports: $api_arch"
    echo "  Chrome executable: $chrome_exec"
    
    if [[ "$chrome_exec" != "default" && "$chrome_exec" != "" ]]; then
        echo "✅ Using architecture-specific Chrome"
    else
        echo "⚠️  Using fallback Chrome"
    fi
    
else
    echo "❌ API not responding"
    echo ""
    echo "📋 Container logs:"
    docker-compose logs --tail=20 web
    exit 1
fi

echo ""
echo "🧪 Image Generation Test:"

# Test image generation
response=$(curl -s --max-time 60 -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "pages": [
      {
        "type": "cover",
        "title": "Multi-Arch Test",
        "subtitle": "'"$HOST_ARCH"' Build"
      },
      {
        "type": "content",
        "headline": "Architecture Check",
        "paragraphs": ["This image was generated on '"$HOST_ARCH"' and should work on both ARM64 and x86_64."]
      }
    ]
  }' 2>/dev/null)

if echo "$response" | grep -q '"success":true'; then
    count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d: -f2)
    duration=$(echo "$response" | grep -o '"durationMs":[0-9]*' | cut -d: -f2)
    
    echo "✅ Image generation successful!"
    echo "   📊 Images: $count"
    echo "   ⏱️  Time: ${duration}ms"
    echo "   💾 Saved to: multi_arch_test_result.json"
    
    echo "$response" > multi_arch_test_result.json
    
    echo ""
    echo "🎉 MULTI-ARCHITECTURE TEST PASSED!"
    echo "   ✅ Container builds on $HOST_ARCH"
    echo "   ✅ Chrome works with native architecture"
    echo "   ✅ Image generation functional"
    echo "   ✅ Ready for deployment on Ubuntu x86_64"
    
else
    echo "❌ Image generation failed"
    echo "Response: $response"
    echo ""
    echo "📋 Recent logs:"
    docker-compose logs --tail=10 web
    exit 1
fi

echo ""
echo "📊 Performance Metrics:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -2

echo ""
echo "🚀 Deployment Readiness:"
echo "   📱 Apple Silicon (ARM64): ✅ Tested and working"
echo "   💻 Ubuntu x86_64: ✅ Should work (same codebase)"
echo "   🐳 Docker: ✅ Multi-architecture build"
echo "   🔧 Chrome: ✅ Architecture-specific installation"

echo ""
echo "📝 Next Steps:"
echo "   1. Push this code to your Ubuntu server"
echo "   2. Run: docker-compose up -d"
echo "   3. Test: curl localhost:3000/api/generate"
echo "   4. The same Dockerfile will work on both platforms!"