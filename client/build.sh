#!/bin/bash

# Install all dependencies including dev dependencies
npm ci --include=dev

# Run the build
npm run build
