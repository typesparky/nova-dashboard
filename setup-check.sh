#!/bin/bash

echo "Nova Capital Dashboard - Setup Verification Script"
echo "=================================================="
echo ""

# Check Node.js version
echo "1. Checking Node.js version..."
if command -v node &> /dev/null; then
    node_version=$(node -v)
    echo "✓ Node.js version: $node_version"
else
    echo "✗ Node.js not found. Please install Node.js v20+"
    exit 1
fi

# Check npm
echo ""
echo "2. Checking npm..."
if command -v npm &> /dev/null; then
    npm_version=$(npm -v)
    echo "✓ npm version: $npm_version"
else
    echo "✗ npm not found"
    exit 1
fi

# Check if .env exists
echo ""
echo "3. Checking environment configuration..."
if [ -f .env ]; then
    echo "✓ .env file exists"
    if grep -q "your_fred_api_key_here" .env; then
        echo "⚠ Warning: .env contains default placeholder values"
        echo "  Set your actual API keys in .env file"
    else
        echo "✓ API keys appear to be configured"
    fi
else
    echo "⚠ .env file not found. Create it from .env.example"
    echo "  cp .env.example .env"
fi

# Check backend dependencies
echo ""
echo "4. Checking backend dependencies..."
if [ -f package.json ]; then
    if grep -q "express" package.json; then
        echo "✓ Backend dependencies installed"
    else
        echo "⚠ Backend dependencies not installed"
        echo "  npm install express cors axios"
    fi
else
    echo "✗ package.json not found"
fi

# Check frontend dependencies
echo ""
echo "5. Checking frontend dependencies..."
if [ -f package.json ]; then
    if grep -q "react" package.json; then
        echo "✓ Frontend dependencies installed"
    else
        echo "✗ React not found in package.json"
    fi
else
    echo "✗ package.json not found"
fi

# Check server.js
echo ""
echo "6. Checking backend server file..."
if [ -f server.js ]; then
    echo "✓ server.js exists"
    if grep -q "app.listen" server.js; then
        echo "✓ Server appears to be configured"
    else
        echo "⚠ Server may need configuration"
    fi
else
    echo "✗ server.js not found"
fi

echo ""
echo "=================================================="
echo "Setup Verification Complete"
echo ""
echo "To start the dashboard:"
echo "  1. Copy .env.example to .env and add your API keys"
echo "  2. Start backend: node server.js"
echo "  3. Start frontend: npm run dev"
echo ""
echo "For mock data only (no API keys):"
echo "  npm run dev"
