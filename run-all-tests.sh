#!/bin/bash
# run-all-tests.sh - Run all tests for the project

set -e # Exit on error

echo "🧪 Running All Tests for WoB Product Explorer"
echo "=============================================="
echo ""

# Backend Tests
echo "📦 Backend Tests"
echo "----------------"
cd backend

echo "✓ Installing dependencies..."
npm ci --silent

echo "✓ Running unit tests..."
npm test -- --coverage --silent

echo "✓ Running E2E tests..."
npm run test:e2e -- --silent

echo ""
echo "✅ Backend tests completed!"
echo ""

# Frontend Tests
echo "🎨 Frontend Tests"
echo "-----------------"
cd ../frontend

echo "✓ Installing dependencies..."
npm ci --silent

echo "✓ Running component tests..."
npm test -- --coverage --silent

echo ""
echo "✅ Frontend tests completed!"
echo ""

# Summary
echo "=============================================="
echo "🎉 All Tests Passed!"
echo "=============================================="
echo ""
echo "📊 Coverage Reports:"
echo "  Backend:  backend/coverage/lcov-report/index.html"
echo "  Frontend: frontend/coverage/lcov-report/index.html"
echo ""