#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install

# Create necessary directories
mkdir -p uploads/products

# Verify critical dependencies
node -e "['multer', 'cloudinary', 'mongoose'].forEach(dep => require(dep))"

echo "Build completed successfully"