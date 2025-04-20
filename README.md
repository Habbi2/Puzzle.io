# Multiplayer Puzzle Reordering Game

A real-time multiplayer puzzle reordering game built with React, TypeScript, and Socket.IO. Players can join game rooms, collaborate to solve puzzles by reordering pieces, and chat with each other.

## Features

- Real-time multiplayer functionality using WebSockets (Socket.IO)
- Interactive drag-and-drop puzzle pieces
- Game rooms that allow multiple players to join and play together
- Real-time chat functionality for players in the same room
- Visual feedback when puzzle pieces are placed correctly
- Celebration when the puzzle is solved

## Technology Stack

- **Frontend**: React, TypeScript, Styled Components, React DnD (drag and drop)
- **Backend**: Node.js, Express, Socket.IO
- **Deployment**: Netlify (frontend), Heroku/Render/Railway (backend)

## Running Locally

### Running the Server

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies (if not already done):
   ```
   npm install
   ```

3. Start the server in development mode:
   ```
   npm run dev
   ```

The WebSocket server will start on port 3001 by default.

### Running the Client

1. Open a new terminal and navigate to the project root directory.

2. Start the React development server:
   ```
   npm start
   ```

3. Open your browser to `http://localhost:3000` to access the application.

## How to Play

1. Enter your name and a game ID on the lobby screen.
2. Share the game ID with friends so they can join the same game.
3. Drag and drop the puzzle pieces to rearrange them.
4. The pieces will turn green when placed in their correct positions.
5. Complete the puzzle by arranging all pieces correctly!

## Deployment

### Deploying the Backend

For the backend Socket.IO server, you can deploy to platforms like Heroku, Render, or Railway:

1. Create an account on your preferred platform
2. Connect your GitHub repository
3. Set up a new app from the server directory
4. Deploy the server

### Deploying to Netlify

The frontend is configured for easy deployment to Netlify:

1. Sign in to Netlify
2. Click "New site from Git"
3. Connect to your GitHub repository
4. Use the following settings:
   - Build command: `npm run build`
   - Publish directory: `build`
5. Click "Deploy site"

**Important:** After deploying the backend, update the server URL in the frontend:

1. Navigate to `src/context/SocketContext.tsx`
2. Find the line where the `serverUrl` default is set
3. Replace the default with your deployed backend URL
4. Redeploy the frontend

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
