#!/usr/bin/env bash
# Exit on error and print each command
set -ex

# Install dependencies in client
echo "Installing and building client..."
cd client
npm ci # Using ci instead of install for cleaner installs
npm run build
cd ..

# Install dependencies in server
echo "Installing server dependencies..."
cd server
npm ci # Using ci instead of install for cleaner installs

# Create necessary directories
mkdir -p uploads/products
mkdir -p dist

# Verify critical dependencies
node -e "['multer', 'cloudinary', 'mongoose'].forEach(dep => require(dep))"

# Move client build to server directory
echo "Moving client build to server..."
rm -rf dist/*
cp -r ../client/dist/* ./dist/

# Create _redirects file for SPA routing
echo "/* /index.html 200" > dist/_redirects

echo "Build completed successfully!"