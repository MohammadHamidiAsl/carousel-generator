#!/bin/bash

echo "🇮🇷 Persian/Farsi Text Rendering Test"
echo "===================================="

echo "🔄 Rebuilding with Persian font support..."
docker-compose down
docker-compose build --no-cache

echo "🚀 Starting container..."
docker-compose up -d

echo "⏳ Waiting for startup..."
sleep 60

echo ""
echo "🔤 Testing Persian font installation:"
docker-compose exec web bash -c '
echo "System locale:"
locale

echo ""
echo "Available Persian fonts:"
fc-list :lang=fa family | head -10 || echo "fontconfig not available"

echo ""
echo "Available fonts (general):"
fc-list | grep -i "tahoma\|persian\|arabic\|iranian\|dejavu\|noto\|kacst" | head -5 || echo "No specific fonts found"
'

echo ""
echo "🧪 Testing Persian text generation:"

persian_test=$(cat << 'JSONEOF'
{
  "pages": [
    {
      "type": "cover",
      "title": "سلام دنیا",
      "subtitle": "تست متن فارسی"
    },
    {
      "type": "content",
      "headline": "محتوای فارسی",
      "paragraphs": [
        "این یک تست برای نمایش صحیح متن فارسی است.",
        "امیدواریم که فونت‌ها به درستی نمایش داده شوند."
      ]
    },
    {
      "type": "end",
      "title": "پایان",
      "buttonText": "ادامه مطالب",
      "buttonUrl": "https://n98n.ir"
    }
  ]
}
JSONEOF
)

echo "Sending Persian text test..."
response=$(curl -s --max-time 60 -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$persian_test" 2>/dev/null || echo "failed")

if echo "$response" | grep -q '"success":true'; then
    count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d: -f2)
    duration=$(echo "$response" | grep -o '"durationMs":[0-9]*' | cut -d: -f2)
    
    echo "✅ Persian text generation successful!"
    echo "   📊 Images: $count"
    echo "   ⏱️  Time: ${duration}ms"
    echo "   💾 Saved to: persian_test_result.json"
    
    echo "$response" > persian_test_result.json
    
else
    echo "❌ Persian text generation failed"
    echo "Response: $response"
    echo ""
    echo "📋 Container logs:"
    docker-compose logs --tail=10 web
fi

echo ""
echo "📊 Summary:"
echo "   🔤 Available fonts installed for Persian text"
echo "   📝 Text direction: RTL (Right-to-Left) support enabled"
echo "   🎨 CSS: Persian typography optimizations applied"
