#!/bin/bash

# Exit on any error
set -e

echo "Starting build process..."

# Ensure we're in the correct directory
cd "$(dirname "$0")"

echo "Installing dependencies..."
# Install dependencies including dev dependencies
npm ci --include=dev

echo "Running build..."
# Run the build
npm run build

echo "Build completed successfully!"
