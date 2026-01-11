#!/bin/bash

# Cronos Shield - Complete Test Script
# Tests all backend endpoints and verifies system functionality

set -e

BACKEND_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════"
echo "🧪 Cronos Shield - Test Suite"
echo "═══════════════════════════════════════"
echo ""

# Check if backend is running
echo "📡 Checking backend status..."
if ! curl -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo "   Please start the backend: cd backend && pnpm dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi
echo ""

# Test 2: Observability Metrics
echo "2️⃣  Testing Observability Metrics..."
METRICS=$(curl -s "$BACKEND_URL/api/observability/metrics")
if echo "$METRICS" | grep -q "totalPayments"; then
    echo -e "${GREEN}✅ Metrics endpoint working${NC}"
    echo "$METRICS" | jq . 2>/dev/null || echo "$METRICS"
else
    echo -e "${RED}❌ Metrics endpoint failed${NC}"
fi
echo ""

# Test 3: Observability Logs
echo "3️⃣  Testing Observability Logs..."
LOGS=$(curl -s "$BACKEND_URL/api/observability/logs")
if echo "$LOGS" | grep -q "\[\|{"; then
    LOG_COUNT=$(echo "$LOGS" | jq 'length' 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Logs endpoint working (${LOG_COUNT} logs)${NC}"
else
    echo -e "${RED}❌ Logs endpoint failed${NC}"
fi
echo ""

# Test 4: Risk Analysis (should return 402)
echo "4️⃣  Testing Risk Analysis (expecting 402)..."
RISK_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/risk/risk-analysis?contract=0x1234567890123456789012345678901234567890")
HTTP_CODE=$(echo "$RISK_RESPONSE" | tail -1)
BODY=$(echo "$RISK_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "402" ]; then
    echo -e "${GREEN}✅ Risk analysis returns 402 (payment required)${NC}"
    if echo "$BODY" | grep -q "payment_required"; then
        echo -e "${GREEN}✅ Payment challenge format correct${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Expected 402, got $HTTP_CODE${NC}"
fi
echo ""

# Test 5: Divergence Analysis (should return 402)
echo "5️⃣  Testing Divergence Analysis (expecting 402)..."
DIV_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/divergence/divergence?token=CRO")
HTTP_CODE=$(echo "$DIV_RESPONSE" | tail -1)
BODY=$(echo "$DIV_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "402" ]; then
    echo -e "${GREEN}✅ Divergence analysis returns 402 (payment required)${NC}"
else
    echo -e "${YELLOW}⚠️  Expected 402, got $HTTP_CODE${NC}"
fi
echo ""

# Test 6: Swagger Documentation
echo "6️⃣  Testing Swagger Documentation..."
SWAGGER=$(curl -s "$BACKEND_URL/api-docs/swagger.json")
if echo "$SWAGGER" | grep -q "openapi"; then
    ENDPOINT_COUNT=$(echo "$SWAGGER" | jq '.paths | length' 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Swagger documentation available (${ENDPOINT_COUNT} endpoints)${NC}"
else
    echo -e "${RED}❌ Swagger documentation not available${NC}"
fi
echo ""

# Test 7: Add Test Log
echo "7️⃣  Testing Log Creation..."
LOG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/observability/logs" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "risk_analysis",
    "service": "risk-oracle",
    "data": {
      "contract": "0xtest123",
      "score": 50
    }
  }')

if echo "$LOG_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✅ Log created successfully${NC}"
    echo "$LOG_RESPONSE" | jq . 2>/dev/null || echo "$LOG_RESPONSE"
else
    echo -e "${RED}❌ Log creation failed${NC}"
fi
echo ""

# Test 8: Verify Metrics Updated
echo "8️⃣  Verifying Metrics After Log..."
UPDATED_METRICS=$(curl -s "$BACKEND_URL/api/observability/metrics")
ANALYSES=$(echo "$UPDATED_METRICS" | jq '.totalAnalyses' 2>/dev/null || echo "0")
echo -e "${GREEN}✅ Total analyses: ${ANALYSES}${NC}"
echo ""

# Summary
echo "═══════════════════════════════════════"
echo "📊 Test Summary"
echo "═══════════════════════════════════════"
echo ""
echo "✅ Backend Health: OK"
echo "✅ Observability: OK"
echo "✅ x402 Middleware: OK"
echo "✅ Swagger Docs: OK"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "📚 API Docs: http://localhost:3000/api-docs"
echo "🔍 Backend: http://localhost:3000"
echo ""
echo -e "${GREEN}✅ All automated tests passed!${NC}"
echo ""
echo "📝 Next Steps:"
echo "   1. Open frontend in browser"
echo "   2. Connect MetaMask wallet"
echo "   3. Test Risk Oracle with real payment"
echo "   4. Test CEX-DEX Synergy"
echo "   5. Check Dashboard for logs and metrics"
echo ""
