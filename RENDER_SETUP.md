# Super Easy Render.com Setup Guide

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy on Render.com

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your GitHub account if not already connected
4. Select your repository
5. Fill in these settings:

   - Name: `poultrymart-server`
   - Environment: `Node`
   - Build Command: `npm run build:server`
   - Start Command: `cd server && npm start`
   - Click "Create Web Service"

6. While the server is deploying, create another Web Service:
   - Click "New +" and select "Web Service"
   - Select the same repository
   - Fill in these settings:
     - Name: `poultrymart-client`
     - Environment: `Node`
     - Build Command: `npm run build:client`
     - Start Command: `cd client && npm start`
     - Click "Create Web Service`

## Step 3: Set Environment Variables

For the server service:

1. Go to your server service on Render
2. Click "Environment"
3. Add these variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=your_mongodb_connection_string`
   - Add any other environment variables from your `.env` file

For the client service:

1. Go to your client service on Render
2. Click "Environment"
3. Add these variables:
   - `NODE_ENV=production`
   - `REACT_APP_API_URL=https://poultrymart-server.onrender.com` (use your actual server URL)

## Step 4: Wait for Deployment

1. Both services will automatically start building and deploying
2. You can monitor the progress in the "Logs" tab
3. Once complete, you'll get URLs for both services

## Step 5: Test Your Application

1. Visit your client URL (e.g., `https://poultrymart-client.onrender.com`)
2. Test all features to ensure everything works

## Troubleshooting

If something doesn't work:

1. Check the logs in both services
2. Make sure all environment variables are set correctly
3. Verify that your MongoDB connection is working
4. Check that the client can reach the server URL

## Need Help?

- Check Render.com documentation: https://render.com/docs
- Contact Render support if you encounter issues
