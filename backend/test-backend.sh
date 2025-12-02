#!/bin/bash
# Test Backend Connection
# Run this to verify backend is working

echo "🔍 Testing DSUC Labs Backend..."
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check:"
curl -s https://dsuc-labs-xmxl.onrender.com/api/health | jq '.'
echo ""

# Test 2: Members endpoint
echo "2️⃣ Members endpoint:"
curl -s https://dsuc-labs-xmxl.onrender.com/api/members | jq '.success, .count'
echo ""

# Test 3: Events endpoint
echo "3️⃣ Events endpoint:"
curl -s https://dsuc-labs-xmxl.onrender.com/api/events | jq '.success, .count'
echo ""

# Test 4: Projects endpoint
echo "4️⃣ Projects endpoint:"
curl -s https://dsuc-labs-xmxl.onrender.com/api/projects | jq '.success, .count'
echo ""

# Test 5: CORS check
echo "5️⃣ CORS Headers:"
curl -I -H "Origin: https://dsuc.fun" https://dsuc-labs-xmxl.onrender.com/api/health 2>&1 | grep -i "access-control"
echo ""

echo "✅ Tests complete!"
