# Deploying the React Multiplayer Puzzle Game to Netlify

This guide explains how to deploy your multiplayer puzzle game to Netlify, including both the React frontend and the Socket.IO backend server.

## Prerequisites

1. A [Netlify account](https://app.netlify.com/signup)
2. Git repository with your code (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Push your code to a Git repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Log in to Netlify

Go to [Netlify](https://app.netlify.com/) and log in with your account.

### 3. Create a new site

Click on "New site from Git" and connect to your Git provider.

### 4. Configure the build settings

- Select your repository
- Build command: This is already configured in your `netlify.toml` file
- Publish directory: This is already configured in your `netlify.toml` file

### 5. Configure environment variables

In the Netlify dashboard, go to "Site settings" > "Build & deploy" > "Environment variables" and add:

- `NODE_ENV`: Set to `production`
- `CLIENT_URL`: Set to your Netlify site URL (e.g., `https://your-site-name.netlify.app`)

### 6. Deploy the site

Click "Deploy site" to start the deployment process.

### 7. Monitor deployment

Netlify will deploy both your React frontend and Socket.IO backend as Netlify Functions. You can monitor the deployment in the "Deploys" section of the Netlify dashboard.

### 8. Verify the deployment

Once the deployment is complete, visit your site URL to make sure everything is working correctly. Test the multiplayer features to ensure the Socket.IO connection is working.

## Troubleshooting

If you encounter any issues with your deployment:

1. Check the function logs in the Netlify dashboard under "Functions"
2. Make sure your environment variables are correctly set
3. Check that the Socket.IO path in your frontend code matches the Netlify Function path

## Updating the deployment

Any subsequent pushes to your connected Git branch will trigger automatic redeployments on Netlify.

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)