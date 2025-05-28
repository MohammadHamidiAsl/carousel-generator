#!/bin/bash
set -e

ARCH=$(dpkg --print-architecture)
echo "🚀 Starting Carousel Generator on $ARCH"

# Find system Chromium
CHROME_PATHS=(
    "/usr/bin/chromium"
    "/usr/bin/chromium-browser"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/google-chrome"
)

CHROME_PATH=""
for path in "${CHROME_PATHS[@]}"; do
    if [ -x "$path" ]; then
        CHROME_PATH="$path"
        break
    fi
done

if [ -n "$CHROME_PATH" ]; then
    echo "✅ Found system browser: $CHROME_PATH"
    export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
    
    # Test browser
    echo "🧪 Testing browser..."
    if timeout 10s "$CHROME_PATH" --headless --disable-gpu --no-sandbox --dump-dom about:blank > /dev/null 2>&1; then
        echo "✅ Browser test successful"
    else
        echo "⚠️  Browser test failed, but continuing..."
    fi
else
    echo "❌ No system browser found!"
    exit 1
fi

echo "🌐 Starting Next.js server..."
exec npm start
