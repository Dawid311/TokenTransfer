#!/bin/bash

# Token Transfer Deployment Script
echo "🚀 Deploying Token Transfer Application..."

# 1. Environment Setup
echo "1. Setting up environment..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ .env file created. Please configure your values before starting."
else
    echo "✅ .env file exists"
fi

# 2. Install Dependencies
echo "2. Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# 3. Test Setup
echo "3. Testing application setup..."
node test-setup.js
if [ $? -eq 0 ]; then
    echo "✅ Setup test passed"
else
    echo "❌ Setup test failed. Please check your configuration."
    exit 1
fi

# 4. Start Application
echo "4. Starting application..."
echo "🎉 Token Transfer Application is ready!"
echo ""
echo "Available commands:"
echo "  npm start     - Start production server"
echo "  npm run dev   - Start development server with auto-reload"
echo ""
echo "API Endpoints:"
echo "  POST /transfer-token  - Send tokens via webhook"
echo "  GET  /balance        - Check token balance"
echo "  GET  /health         - Health check"
echo ""

# Optional: Start in development mode
read -p "Start development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev
fi
