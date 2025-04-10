#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing and building client..."
cd client
npm install
npm run build
cd ..

echo "Installing server dependencies..."
cd server
npm install

# Create necessary directories
mkdir -p uploads/products

# Verify critical dependencies
node -e "['multer', 'cloudinary', 'mongoose'].forEach(dep => require(dep))"

# Move client build to server directory
echo "Moving client build to server..."
rm -rf dist
mv ../client/dist ./dist

echo "Build completed successfully!"