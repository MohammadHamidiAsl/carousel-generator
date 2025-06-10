#!/bin/bash

echo "🔍 Carousel Generator Debug Script"
echo "=================================="

# Function to run commands and show output
run_cmd() {
    echo "💻 Running: $1"
    eval $1
    echo ""
}

# Check Docker setup
echo "📦 Docker Environment:"
run_cmd "docker --version"
run_cmd "docker-compose --version"
run_cmd "docker system info | grep 'Operating System'"

# Check if containers are running
echo "📊 Container Status:"
run_cmd "docker-compose ps"

# Check container logs
echo "📋 Recent Container Logs:"
run_cmd "docker-compose logs --tail=20 web"

# Test browser inside container
echo "🌐 Browser Test Inside Container:"
if docker-compose ps | grep -q "Up"; then
    echo "Testing browser executables inside container..."
    
    # Check what browsers are available
    run_cmd "docker-compose exec web find /usr/bin -name '*chrom*' -executable 2>/dev/null || echo 'No Chrome/Chromium found in /usr/bin'"
    
    # Check environment variables
    run_cmd "docker-compose exec web env | grep -E '(CHROME|PUPPETEER)' || echo 'No browser environment variables set'"
    
    # Test browser execution
    echo "Testing browser execution..."
    docker-compose exec web bash -c '
        for browser in /usr/bin/google-chrome-stable /usr/bin/google-chrome /usr/bin/chromium /usr/bin/chromium-browser; do
            if [ -x "$browser" ]; then
                echo "✅ Found executable: $browser"
                if timeout 10s $browser --headless --disable-gpu --dump-dom about:blank > /dev/null 2>&1; then
                    echo "✅ Browser test successful: $browser"
                else
                    echo "❌ Browser test failed: $browser"
                fi
            else
                echo "❌ Not found: $browser"
            fi
        done
    '
else
    echo "❌ Container is not running. Start with: docker-compose up -d"
fi

# Test API endpoints
echo "🔌 API Testing:"
if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null; then
    echo "✅ Container is accessible on port 3000"
    
    # Test health endpoint
    health_response=$(curl -s http://localhost:3000/api/generate 2>/dev/null || echo "failed")
    if [[ "$health_response" != "failed" ]]; then
        echo "✅ API endpoint is responding"
    else
        echo "❌ API endpoint is not responding"
    fi
    
    # Test simple generation
    echo "Testing image generation..."
    test_response=$(curl -s -X POST http://localhost:3000/api/generate \
        -H "Content-Type: application/json" \
        -d '{"pages":[{"type":"cover","title":"Debug Test"}]}' 2>/dev/null || echo "failed")
    
    if echo "$test_response" | grep -q '"success":true'; then
        echo "✅ Image generation test passed"
    else
        echo "❌ Image generation test failed"
        echo "Response: $test_response"
    fi
else
    echo "❌ Cannot connect to container on port 3000"
fi

# Check system resources
echo "💾 System Resources:"
run_cmd "docker stats --no-stream --format 'table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' | head -5"

# Check image size
echo "📏 Image Information:"
run_cmd "docker images | grep carousel-generator"

# Architecture info
echo "🏗️  Architecture Information:"
run_cmd "uname -m"
run_cmd "docker version --format 'Client: {{.Client.Arch}} Server: {{.Server.Arch}}'"

# Suggestions
echo "💡 Troubleshooting Tips:"
echo "1. If browser not found:"
echo "   - Try: docker-compose down && docker-compose up --build -d"
echo "   - Check logs: docker-compose logs -f web"
echo ""
echo "2. If API not responding:"
echo "   - Wait 60-90 seconds for full startup"
echo "   - Check health: curl http://localhost:3000/api/generate"
echo ""
echo "3. If memory issues:"
echo "   - Increase Docker memory limit to 2GB+"
echo "   - Monitor: docker stats"
echo ""
echo "4. Architecture-specific issues:"
echo "   - ARM64 Macs: Use Chromium instead of Chrome"
echo "   - x86_64 systems: Google Chrome should work"
echo ""
echo "5. Common fixes:"
echo "   - docker system prune -f"
echo "   - docker-compose down && docker-compose build --no-cache && docker-compose up -d"

echo "🔧 Debug complete! Check the output above for any issues."