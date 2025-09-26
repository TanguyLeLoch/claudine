#!/bin/bash

# Build script for Claudine Electron App
# Usage: ./build.sh [mac|win|linux|all]

set -e

echo "🔧 Building Claudine Electron App..."

# Default to current platform if no argument provided
PLATFORM=${1:-"current"}

# Build Angular app first
echo "📦 Building Angular application..."
npm run build

# Check if build was successful
if [ ! -d "dist/claudine/browser" ]; then
    echo "❌ Angular build failed or dist directory not found"
    exit 1
fi

echo "✅ Angular build completed successfully"

# Build for specified platform(s)
case $PLATFORM in
    "mac"|"macos")
        echo "🍎 Building for macOS..."
        npm run build:mac
        ;;
    "win"|"windows")
        echo "🪟 Building for Windows..."
        npm run build:win
        ;;
    "linux")
        echo "🐧 Building for Linux..."
        npm run build:linux
        ;;
    "all")
        echo "🌍 Building for all platforms..."
        npm run build:all
        ;;
    "current")
        echo "📱 Building for current platform..."
        npm run dist
        ;;
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "Usage: ./build.sh [mac|win|linux|all|current]"
        exit 1
        ;;
esac

echo "🎉 Build completed! Check the 'release' directory for your executables."
echo "📁 Built files are located in: ./release/"