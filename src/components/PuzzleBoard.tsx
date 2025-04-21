import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import CustomDndProvider from './CustomDndProvider';
import { PuzzlePiece as PuzzlePieceComponent } from './PuzzlePiece';
import { useSocket } from '../context/SocketContext';
import { PuzzlePiece as PuzzlePieceType } from '../types/game';
import { isMobileDevice, isTouchDevice } from '../utils/deviceDetection';

const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: var(--spacing-lg);
`;

const PlayersInfo = styled.div`
  font-size: 14px;
  color: var(--color-text-secondary);
`;

const ResetButton = styled.button`
  background-color: var(--color-error);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    opacity: 0.9;
  }
`;

const PuzzleImage = styled.img`
  max-width: 100%;
  max-height: 500px; // Increased height since this is the main content now
  margin-bottom: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
`;

const LoadingMessage = styled.div`
  margin: var(--spacing-lg) 0;
  text-align: center;
  color: var(--color-text-secondary);
`;

const NoImageMessage = styled.div`
  margin: var(--spacing-lg) 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-style: italic;
`;

const PuzzleGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$columns}, 1fr);
  gap: 4px;
  margin-top: var(--spacing-lg);
  max-width: 100%;
  width: min(90vw, 800px);
`;

const DifficultySelector = styled.div`
  margin-bottom: var(--spacing-lg);
  width: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
`;

const DifficultyButton = styled.button<{ $active: boolean }>`
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: ${props => props.$active ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)'};
  color: ${props => props.$active ? 'white' : 'var(--color-text-secondary)'};
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$active ? 'var(--color-accent-secondary)' : 'var(--color-bg-tertiary)'};
    opacity: ${props => props.$active ? 1 : 0.8};
  }
`;

const CompletionMessage = styled.div`
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-success);
  border-radius: var(--radius-md);
  color: white;
  font-weight: 500;
  text-align: center;
  box-shadow: var(--shadow-sm);
`;

interface PuzzleBoardProps {
  imageUrl?: string; // This will be ignored in favor of the game state image
}

type Difficulty = 'easy' | 'medium' | 'hard';

const PuzzleBoard: React.FC<PuzzleBoardProps> = () => {
  const { gameState, resetGame, movePiece: socketMovePiece, updateDifficulty: socketUpdateDifficulty } = useSocket();
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePieceType[]>([]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzleStarted, setPuzzleStarted] = useState<boolean>(false);
  
  // Always use the gameState.puzzleImage from server
  const displayImageUrl = gameState?.puzzleImage || null;
  
  // Add console logging to track what URL we're trying to load
  useEffect(() => {
    if (displayImageUrl) {
      console.log('Attempting to load image from URL:', displayImageUrl);
    }
  }, [displayImageUrl]);
  
  // Use device detection to optimize for mobile devices
  const isMobile = isMobileDevice();
  const isTouch = isTouchDevice();
  
  // Get grid size based on difficulty - adjusted for mobile devices
  const getGridSize = (): { rows: number, columns: number } => {
    // For mobile devices, reduce grid size by 1 for better usability
    const mobileSizeReduction = isMobile ? 1 : 0;
    // For touch devices, add additional spacing by reducing pieces slightly
    const touchSizeReduction = isTouch && !isMobile ? 1 : 0;
    const totalReduction = mobileSizeReduction + touchSizeReduction;
    
    switch(difficulty) {
      case 'easy': return { 
        rows: Math.max(3, 4 - totalReduction), 
        columns: Math.max(3, 4 - totalReduction) 
      }; 
      case 'medium': return { 
        rows: Math.max(4, 6 - totalReduction), 
        columns: Math.max(4, 6 - totalReduction) 
      };
      case 'hard': return { 
        rows: Math.max(6, 8 - totalReduction), 
        columns: Math.max(6, 8 - totalReduction) 
      };
      default: return { 
        rows: Math.max(4, 6 - totalReduction), 
        columns: Math.max(4, 6 - totalReduction) 
      };
    }
  };
  
  const { rows, columns } = getGridSize();
  const totalPieces = rows * columns;
  
  // Create puzzle pieces from the image - only run when server sends a new puzzle image
  const createPuzzlePieces = useCallback(() => {
    if (!gameState || !displayImageUrl) return;
    
    // If game state already has puzzle data, don't recreate
    if (gameState.puzzle && gameState.puzzle.length > 0 && puzzleStarted) {
      return;
    }
    
    const pieces: PuzzlePieceType[] = [];
    
    // Create the ordered puzzle pieces
    for (let i = 0; i < totalPieces; i++) {
      pieces.push({
        id: `piece${i}`,
        position: i, // Initially in the correct position
        correctPosition: i,
        content: `${i}` // Fallback content
      });
    }
    
    // Shuffle the positions
    // Using a more compatible approach to create an array of indices
    const shuffledPositions: number[] = [];
    for (let i = 0; i < totalPieces; i++) {
      shuffledPositions.push(i);
    }
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
    }
    
    // Assign shuffled positions
    pieces.forEach((piece, index) => {
      piece.position = shuffledPositions[index];
    });
    
    setPuzzlePieces(pieces);
    setIsPuzzleSolved(false);
    setPuzzleStarted(true); // Mark the puzzle as started once pieces are created
    
    // Update server with new puzzle pieces through socket events
    if (gameState && socketMovePiece) {
      // Notify the server about the initial state of all pieces
      pieces.forEach(piece => {
        socketMovePiece(piece.id, piece.position);
      });
    }
  }, [gameState, displayImageUrl, socketMovePiece, puzzleStarted, totalPieces]);
  // Removed unnecessary 'rows' and 'columns' dependencies
  
  // Reset image states when URL changes
  useEffect(() => {
    if (displayImageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [displayImageUrl]);
  
  // Check if puzzle is solved
  useEffect(() => {
    if (puzzlePieces.length > 0) {
      const solved = puzzlePieces.every(piece => piece.position === piece.correctPosition);
      setIsPuzzleSolved(solved);
    }
  }, [puzzlePieces]);
  
  // Sync puzzle pieces from the game state when it changes
  useEffect(() => {
    if (gameState && gameState.puzzle && gameState.puzzle.length > 0) {
      // If we don't have local puzzle pieces yet, use the ones from server
      if (!puzzleStarted || puzzlePieces.length === 0) {
        setPuzzlePieces(gameState.puzzle);
        setPuzzleStarted(true);
      } else {
        // Only update if there's an actual difference between local and server state
        const needsUpdate = gameState.puzzle.some(serverPiece => {
          const localPiece = puzzlePieces.find(p => p.id === serverPiece.id);
          return !localPiece || localPiece.position !== serverPiece.position;
        });
        
        if (needsUpdate) {
          // Update local pieces from game state
          const updatedPieces = [...puzzlePieces]; // Create a new array to avoid mutating state
          
          gameState.puzzle.forEach(serverPiece => {
            const localPieceIndex = updatedPieces.findIndex(p => p.id === serverPiece.id);
            if (localPieceIndex !== -1) {
              // Update local piece position if it's different from server
              if (updatedPieces[localPieceIndex].position !== serverPiece.position) {
                updatedPieces[localPieceIndex] = {
                  ...updatedPieces[localPieceIndex],
                  position: serverPiece.position
                };
              }
            }
          });
          
          setPuzzlePieces(updatedPieces);
        }
      }
    }
  }, [gameState, gameState?.puzzle, puzzleStarted, puzzlePieces]);
  
  // Move a puzzle piece
  const movePiece = (dragIndex: number, hoverIndex: number) => {
    // Find pieces by their current indices
    const dragPiece = puzzlePieces.find(p => p.position === dragIndex);
    const hoverPiece = puzzlePieces.find(p => p.position === hoverIndex);
    
    if (dragPiece && hoverPiece) {
      // Create a new array to avoid mutating state
      const newPieces = puzzlePieces.map(piece => {
        if (piece.id === dragPiece.id) {
          return { ...piece, position: hoverIndex };
        }
        if (piece.id === hoverPiece.id) {
          return { ...piece, position: dragIndex };
        }
        return piece;
      });
      
      // Use setState callback to ensure we have the most current state
      setPuzzlePieces(newPieces);
      
      // Use the socket movePiece function to update the server
      if (socketMovePiece) {
        // Add a small delay to ensure a smooth animation before sending updates
        setTimeout(() => {
          socketMovePiece(dragPiece.id, hoverIndex);
          socketMovePiece(hoverPiece.id, dragIndex);
        }, 50);
      }
    }
  };
  
  // Handle changing difficulty
  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    
    if (socketUpdateDifficulty) {
      socketUpdateDifficulty(newDifficulty);
    }
    
    // No need for immediate grid recalculation, wait for server to confirm
  };
  
  if (!gameState) {
    return <LoadingMessage>Loading game...</LoadingMessage>;
  }
  
  // Handle image loading events
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    // Create puzzle pieces once the image is loaded
    createPuzzlePieces();
  };
  
  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
    console.error("Failed to load puzzle image:", displayImageUrl);
    
    // Try to determine why the image failed to load
    if (!displayImageUrl) {
      console.error("Image URL is null or empty");
    } else if (displayImageUrl.startsWith('data:')) {
      console.error("Data URL might be too large or malformed");
      // Check if data URL is truncated
      if (displayImageUrl.length > 1000000) {
        console.error("Data URL is very large:", displayImageUrl.length, "characters");
      }
    } else if (!displayImageUrl.match(/^https?:\/\//)) {
      console.error("URL doesn't start with http:// or https://");
    }
  };
  
  const handleResetGame = () => {
    resetGame();
    setPuzzleStarted(false); // Reset puzzle started state
    setPuzzlePieces([]); // Clear the puzzle pieces
    setIsPuzzleSolved(false); // Reset the solved state
    // We keep the current difficulty but allow the user to select a new one
  };
  
  // Sort pieces by their position for display
  const sortedPieces = [...puzzlePieces].sort((a, b) => {
    const posA = a.position;
    const posB = b.position;
    return posA - posB;
  });
  
  return (
    <CustomDndProvider>
      <BoardContainer>
        <StatusBar>
          <PlayersInfo>
            Players: {gameState.players.map(player => player.username).join(', ')}
          </PlayersInfo>
          <ResetButton onClick={handleResetGame}>Reset Puzzle</ResetButton>
        </StatusBar>
        
        {displayImageUrl && imageLoaded && !isPuzzleSolved && !puzzleStarted && (
          <DifficultySelector>
            <DifficultyButton 
              $active={difficulty === 'easy'} 
              onClick={() => handleDifficultyChange('easy')}
            >
              Easy (4x4)
            </DifficultyButton>
            <DifficultyButton 
              $active={difficulty === 'medium'} 
              onClick={() => handleDifficultyChange('medium')}
            >
              Medium (6x6)
            </DifficultyButton>
            <DifficultyButton 
              $active={difficulty === 'hard'} 
              onClick={() => handleDifficultyChange('hard')}
            >
              Hard (8x8)
            </DifficultyButton>
          </DifficultySelector>
        )}
        
        {!displayImageUrl ? (
          <NoImageMessage>
            No puzzle image yet. Please generate one using the tool above.
          </NoImageMessage>
        ) : !imageLoaded && !imageError ? (
          <>
            <LoadingMessage>Loading image...</LoadingMessage>
            <PuzzleImage 
              src={displayImageUrl} 
              alt="Loading puzzle image" 
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ opacity: 0.1 }} 
            />
          </>
        ) : imageError ? (
          <NoImageMessage>
            Failed to load the image. Please try generating a new one.
          </NoImageMessage>
        ) : isPuzzleSolved ? (
          <>
            <CompletionMessage>Puzzle Completed! 🎉</CompletionMessage>
            <PuzzleImage 
              src={displayImageUrl} 
              alt="Completed puzzle" 
            />
          </>
        ) : (
          <>
            {/* Keep the hidden image to ensure it loads properly */}
            <PuzzleImage 
              src={displayImageUrl} 
              alt="Generated image" 
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ visibility: 'hidden', height: '1px', width: '1px', position: 'absolute' }}
            />
            
            {/* Puzzle grid */}
            <PuzzleGrid $columns={columns}>
              {sortedPieces.map((piece, i) => (
                <PuzzlePieceComponent
                  key={piece.id}
                  piece={piece}
                  index={piece.position}
                  movePiece={movePiece}
                  puzzleImage={displayImageUrl || undefined}
                  totalPieces={totalPieces}
                />
              ))}
            </PuzzleGrid>
          </>
        )}
      </BoardContainer>
    </CustomDndProvider>
  );
};

export default PuzzleBoard;