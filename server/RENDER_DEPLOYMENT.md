# Deploying the Puzzle Game Server to Render.com

This guide will walk you through deploying the Socket.IO backend server for the multiplayer puzzle game to Render.com's free tier.

## Prerequisites

- A Render.com account (sign up at https://render.com)
- Your project pushed to a GitHub repository

## Deployment Steps

### 1. Connect Your GitHub Repository

1. Log in to your Render.com account
2. Click on the "New" button in the dashboard
3. Select "Web Service" from the options
4. Connect your GitHub account if not already connected
5. Select the repository containing your puzzle game

### 2. Configure the Web Service

Use the following settings:
- **Name**: puzzle-game-server (or any name you prefer)
- **Environment**: Node
- **Region**: Choose the one closest to your target audience
- **Branch**: main (or your default branch)
- **Build Command**: `cd server && npm install && npm run build`
- **Start Command**: `cd server && node dist/server.js`

### 3. Set Environment Variables

Add the following environment variables:
- `NODE_ENV`: production
- `PORT`: 10000 (Render will automatically provide the correct port)
- `CLIENT_URL`: Your frontend URL (e.g., your Netlify site URL)

### 4. Deploy the Service

1. Click "Create Web Service"
2. Wait for the build and deployment to complete (This might take a few minutes)

### 5. Update Frontend Configuration

After deployment, update your frontend's `.env` file or environment variables with:
```
REACT_APP_SERVER_URL=https://your-app-name.onrender.com
```

## Verifying the Deployment

1. Visit your Render service URL (https://your-app-name.onrender.com)
2. You should see a message indicating that the Socket.IO server is running
3. Check the health endpoint at https://your-app-name.onrender.com/health

## Troubleshooting

- **Connection Issues**: Check CORS settings in server.ts
- **Server Errors**: Check Render logs in the dashboard
- **Frontend Not Connecting**: Verify the correct URL is set in SocketContext.tsx

## Notes

- The free tier may have some limitations on bandwidth and usage
- Your service might spin down after inactivity periods
- Initial connections might be slower as the service wakes up