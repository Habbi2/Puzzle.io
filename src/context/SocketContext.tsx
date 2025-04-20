import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { GameState, ChatMessage } from '../types/game';

// Determine the correct server URL based on environment
const isProduction = process.env.NODE_ENV === 'production';
// In production, connect to the Render-hosted server
// In development, connect to the local server
const API_URL = isProduction
  ? process.env.REACT_APP_SERVER_URL || 'https://puzzle-game-server.onrender.com' // Update with your Render URL
  : process.env.REACT_APP_API_URL || 'http://localhost:3001'; // Local development fallback

// Only use function path for Netlify deployment, not for Render deployment
const isNetlify = API_URL.includes('netlify'); 
const API_PATH = isNetlify ? '/.netlify/functions/socket-server' : '';

interface SocketContextType {
  socket: Socket | null;
  gameState: GameState | null;
  messages: ChatMessage[];
  joinGame: (gameId: string, username: string) => void;
  sendMessage: (message: string) => void;
  movePiece: (pieceId: string, newPosition: number) => void;
  resetGame: () => void;
  setPuzzleImage: (imageUrl: string) => void;
  updateDifficulty: (difficulty: string) => void;
  connected: boolean;
  currentGameId: string | null;
  isImageSyncing: boolean;
  connectionStatus: { connected: boolean, reconnecting: boolean, attemptCount: number };
}

const defaultContext: SocketContextType = {
  socket: null,
  gameState: null,
  messages: [],
  joinGame: () => {},
  sendMessage: () => {},
  movePiece: () => {},
  resetGame: () => {},
  setPuzzleImage: () => {},
  updateDifficulty: () => {},
  connected: false,
  currentGameId: null,
  isImageSyncing: false,
  connectionStatus: { connected: false, reconnecting: false, attemptCount: 0 }
};

const SocketContext = createContext<SocketContextType>(defaultContext);

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ 
  children, 
  serverUrl = API_URL 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isImageSyncing, setIsImageSyncing] = useState(false);
  const maxReconnectAttempts = 5;
  
  // Initialize socket connection with reconnection logic
  useEffect(() => {
    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      path: API_PATH || undefined, // Only set path in production
      autoConnect: true,
      forceNew: true,
      timeout: 20000
    });
    
    console.log('Initializing socket connection to:', serverUrl, 'with path:', API_PATH || 'default');
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      setSocket(newSocket);
      setReconnectAttempts(0);
      
      // If we were in a game before, attempt to rejoin on reconnection
      if (currentGameId) {
        // Use the stored username or fallback to a default
        const username = localStorage.getItem('puzzleGameUsername') || 'Reconnected User';
        newSocket.emit('join_game', { gameId: currentGameId, username });
      }
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });
    
    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${maxReconnectAttempts}`);
      setReconnectAttempts(attempt);
    });
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, currentGameId]);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Game state updates
    socket.on('game_state', (state) => {
      console.log('Received game state:', state);
      setGameState(state);
      
      // If we received a puzzle image from the server, end the image syncing state
      if (state.puzzleImage && isImageSyncing) {
        setIsImageSyncing(false);
      }
    });
    
    // New chat messages
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Player joined notification
    socket.on('player_joined', (player) => {
      console.log(`${player.username} joined the game`);
      // You could show a toast notification here
    });
    
    // Player left notification
    socket.on('player_left', (player) => {
      console.log(`${player.username} left the game`);
      // You could show a toast notification here
    });
    
    // Puzzle solved notification
    socket.on('puzzle_solved', (data) => {
      console.log(`Puzzle solved by ${data.solvedBy} in ${data.timeElapsed / 1000} seconds`);
      // You could show a celebration animation here
    });
    
    // Image sync event
    socket.on('puzzle_image_updated', (data) => {
      console.log('Received puzzle image update:', data.imageUrl?.substring(0, 50) + '...');
      setIsImageSyncing(false);
    });
    
    // Clean up event listeners
    return () => {
      socket.off('game_state');
      socket.off('new_message');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('puzzle_solved');
      socket.off('puzzle_image_updated');
    };
  }, [socket, isImageSyncing]);
  
  // Game actions
  const joinGame = (gameId: string, username: string) => {
    if (!socket) return;
    
    // Store username in localStorage for potential reconnection
    localStorage.setItem('puzzleGameUsername', username);
    
    setCurrentGameId(gameId);
    setMessages([]); // Clear messages when joining a new game
    socket.emit('join_game', { gameId, username });
  };
  
  const sendMessage = (message: string) => {
    if (!socket || !currentGameId) return;
    socket.emit('send_message', { gameId: currentGameId, message });
  };
  
  const movePiece = (pieceId: string, newPosition: number) => {
    if (!socket || !currentGameId) return;
    socket.emit('move_piece', { gameId: currentGameId, pieceId, newPosition });
  };
  
  const resetGame = () => {
    if (!socket || !currentGameId) return;
    socket.emit('reset_game', { gameId: currentGameId });
  };
  
  // Set the puzzle image
  const setPuzzleImage = (imageUrl: string) => {
    if (!socket || !currentGameId) return;
    
    console.log('Sending puzzle image to server:', imageUrl.substring(0, 50) + '...');
    setIsImageSyncing(true); // Set the syncing flag to true when sending an image
    socket.emit('set_puzzle_image', { gameId: currentGameId, imageUrl });
  };
  
  // New function to update difficulty
  const updateDifficulty = (difficulty: string) => {
    if (!socket || !currentGameId) return;
    console.log(`Updating difficulty to ${difficulty}`);
    socket.emit('update_difficulty', { gameId: currentGameId, difficulty });
  };
  
  return (
    <SocketContext.Provider
      value={{
        socket,
        gameState,
        messages,
        joinGame,
        sendMessage,
        movePiece,
        resetGame,
        setPuzzleImage,
        updateDifficulty,
        connected,
        currentGameId,
        isImageSyncing,
        connectionStatus: {
          connected,
          reconnecting: reconnectAttempts > 0,
          attemptCount: reconnectAttempts
        }
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};