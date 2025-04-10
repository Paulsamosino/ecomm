#!/bin/bash

# Install dependencies
npm install

# Build the application
npm run build

# Create _redirects file for SPA routing
echo "/* /index.html 200" > dist/_redirects

# Copy static assets if needed
if [ -d "public" ]; then
  cp -r public/* dist/
fi

echo "Build completed successfully!"