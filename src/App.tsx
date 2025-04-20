import React, { useState, useEffect } from 'react';
import './App.css';
import { SocketProvider, useSocket } from './context/SocketContext';
import GameLobby from './components/GameLobby';
import PuzzleBoard from './components/PuzzleBoard';
import ImageGenerator from './components/ImageGenerator';
import styled from 'styled-components';   

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-primary);
`;

const Header = styled.header`
  margin-bottom: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-primary);
`;

const GameContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const ChatContainer = styled.div`
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 300px;
  overflow-y: auto;
`;

const ChatMessages = styled.div`
  margin-bottom: var(--spacing-md);
`;

const MessageBubble = styled.div`
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const MessageSender = styled.span`
  font-weight: bold;
  margin-right: var(--spacing-sm);
  color: var(--color-accent-secondary);
`;

const ChatForm = styled.form`
  display: flex;
  gap: var(--spacing-sm);
`;

const ChatInput = styled.input`
  flex: 1;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-bg-tertiary);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }
`;

const ChatButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  
  &:hover {
    background-color: var(--color-accent-secondary);
  }
`;

const LeaveButton = styled.button`
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-error);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const GeneratorContainer = styled.div`
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
`;

const SyncingMessage = styled.div`
  background-color: var(--color-bg-tertiary);
  color: var(--color-warning);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  text-align: center;
  margin-bottom: var(--spacing-md);
  font-weight: 500;
`;

// Game room component that shows the game board and chat
const GameRoom: React.FC = () => {
  const { gameState, messages, sendMessage, currentGameId, setPuzzleImage, isImageSyncing } = useSocket();
  const [messageText, setMessageText] = useState('');
  const [showGenerator, setShowGenerator] = useState(true);
  
  // Initialize puzzleImageUrl from gameState when it changes
  useEffect(() => {
    if (gameState && gameState.puzzleImage) {
      // If we have a puzzle image from the server, hide the generator
      setShowGenerator(false);
    } else {
      // If no puzzle image from server, show generator
      setShowGenerator(true);
    }
  }, [gameState]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessage(messageText.trim());
      setMessageText('');
    }
  };
  
  const handleLeaveGame = () => {
    window.location.reload();
  };
  
  const handleImageGenerated = (imageUrl: string) => {
    // If socket context has setPuzzleImage function, call it
    if (setPuzzleImage) {
      setPuzzleImage(imageUrl);
      // Don't hide generator yet - wait for server confirmation
    }
  };
  
  return (
    <div>
      <Header>
        <h1>Game Room: {currentGameId}</h1>
      </Header>
      
      <GameContent>
        {isImageSyncing && (
          <SyncingMessage>
            Syncing puzzle image with other players...
          </SyncingMessage>
        )}
        
        {(showGenerator && !isImageSyncing && (!gameState?.puzzleImage)) && (
          <GeneratorContainer>
            <ImageGenerator onImageGenerated={handleImageGenerated} />
          </GeneratorContainer>
        )}
        
        <PuzzleBoard />
        
        <ChatContainer>
          <h2>Chat</h2>
          <ChatMessages>
            {messages.map((msg, index) => (
              <MessageBubble key={index}>
                <MessageSender>{msg.sender}:</MessageSender>
                {msg.message}
              </MessageBubble>
            ))}
          </ChatMessages>
          
          <ChatForm onSubmit={handleSendMessage}>
            <ChatInput
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
            />
            <ChatButton type="submit">Send</ChatButton>
          </ChatForm>
        </ChatContainer>
        
        <LeaveButton onClick={handleLeaveGame}>
          Leave Game
        </LeaveButton>
      </GameContent>
    </div>
  );
};

// Main app component with socket provider
const App: React.FC = () => {
  return (
    <AppContainer>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AppContainer>
  );
};

// Inner content that can access the socket context
const AppContent: React.FC = () => {
  const { gameState } = useSocket();
  
  return gameState ? <GameRoom /> : <GameLobby />;
};

export default App;
