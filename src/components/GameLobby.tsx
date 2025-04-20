import React, { useState } from 'react';
import styled from 'styled-components';
import { useSocket } from '../context/SocketContext';

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  max-width: 500px;
  margin: 0 auto;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
`;

const Title = styled.h1`
  color: var(--color-accent-secondary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
`;

const Description = styled.p`
  margin-bottom: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  line-height: 1.6;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const Input = styled.input`
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-bg-tertiary);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 1rem;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(92, 107, 192, 0.3);
  }
  
  &::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.7;
  }
`;

const Button = styled.button`
  padding: var(--spacing-md);
  background-color: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--color-accent-secondary);
  }
  
  &:disabled {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    cursor: not-allowed;
  }
`;

// Using $connected as a transient prop to prevent it from being passed to the DOM
const StatusText = styled.p<{ $connected: boolean }>`
  margin-top: var(--spacing-md);
  color: ${props => props.$connected ? 'var(--color-success)' : 'var(--color-error)'};
  font-size: 0.875rem;
`;

const GameLobby: React.FC = () => {
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState('');
  const { joinGame, connected } = useSocket();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim() && gameId.trim()) {
      joinGame(gameId.trim(), username.trim());
    }
  };
  
  return (
    <LobbyContainer>
      <Title>Puzzle Reordering Game</Title>
      <Description>
        Join or create a multiplayer puzzle game. Enter a game ID to join an existing game
        or create a new one. Share the game ID with friends to play together!
      </Description>
      
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        
        <Input
          type="text"
          placeholder="Game ID (e.g., fun-game-123)"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          required
        />
        
        <Button type="submit" disabled={!connected || !username.trim() || !gameId.trim()}>
          Join Game
        </Button>
      </Form>
      
      <StatusText $connected={connected}>
        {connected ? 'Connected to server' : 'Disconnected from server'}
      </StatusText>
    </LobbyContainer>
  );
};

export default GameLobby;