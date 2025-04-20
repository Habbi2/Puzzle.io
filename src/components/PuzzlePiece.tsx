import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import styled from 'styled-components';
import { PuzzlePiece as PuzzlePieceType } from '../types/game';

interface PieceContainerProps {
  $isDragging: boolean;
  $isCorrect: boolean;
  $backgroundImage?: string;
  $correctPosition: number;
  $totalPieces: number;
}

const PieceContainer = styled.div<PieceContainerProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 0;
  padding-bottom: 100%; /* Makes the piece a perfect square */
  font-size: 1rem;
  border-radius: var(--radius-sm);
  cursor: ${props => (props.$isDragging ? 'grabbing' : 'grab')};
  background-color: ${props => (props.$isCorrect ? 'var(--color-success)' : 'var(--color-accent-primary)')};
  opacity: ${props => (props.$isDragging ? 0.5 : 1)};
  box-shadow: ${props => props.$isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)'};
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s;
  position: relative;
  overflow: hidden;
  
  /* Display the correct part of the image based on position */
  background-image: ${props => props.$backgroundImage ? `url(${props.$backgroundImage})` : 'none'};
  background-size: ${props => {
    // Calculate rows/columns needed for the grid based on total pieces
    const columns = Math.ceil(Math.sqrt(props.$totalPieces));
    return `${columns * 100}% ${columns * 100}%`;
  }};
  background-position: ${props => {
    // Calculate grid position based on correctPosition
    const columns = Math.ceil(Math.sqrt(props.$totalPieces));
    const row = Math.floor(props.$correctPosition / columns);
    const col = props.$correctPosition % columns;
    return `${col * 100 / (columns - 1)}% ${row * 100 / (columns - 1)}%`;
  }};
  
  &:hover {
    transform: ${props => (props.$isDragging ? 'none' : 'translateY(-2px)')};
    box-shadow: var(--shadow-md);
  }

  /* Content overlay for piece number */
  .piece-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    opacity: ${props => props.$backgroundImage ? 0 : 1};
    font-weight: bold;
    color: ${props => (props.$isCorrect ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)')};
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* Overlay border to indicate correct placement */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: ${props => props.$isCorrect ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'};
    border-radius: var(--radius-sm);
    pointer-events: none;
    box-shadow: ${props => props.$isCorrect ? 'inset 0 0 10px rgba(255, 255, 255, 0.2)' : 'none'};
  }
`;

interface PuzzlePieceProps {
  piece: PuzzlePieceType;
  index: number;
  movePiece: (dragIndex: number, hoverIndex: number) => void;
  puzzleImage?: string | null;
  totalPieces: number;
}

// Item type for drag and drop
const ItemTypes = {
  PUZZLE_PIECE: 'puzzlePiece',
};

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({ 
  piece, 
  index, 
  movePiece, 
  puzzleImage,
  totalPieces 
}) => {
  const isCorrect = piece.position === piece.correctPosition;
  
  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PUZZLE_PIECE,
    item: { id: piece.id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  
  // Set up drop functionality
  const [, drop] = useDrop({
    accept: ItemTypes.PUZZLE_PIECE,
    hover: (item: { id: string; index: number }) => {
      if (item.index !== index) {
        movePiece(item.index, index);
        item.index = index; // Update the dragged item's index
      }
    },
  });
  
  // Combine drag and drop refs
  const dragDropRef = (el: HTMLDivElement) => {
    drag(el);
    drop(el);
  };
  
  return (
    <PieceContainer 
      ref={dragDropRef} 
      $isDragging={isDragging}
      $isCorrect={isCorrect}
      $backgroundImage={puzzleImage || undefined}
      $correctPosition={piece.correctPosition}
      $totalPieces={totalPieces || 36} // Default to 36 pieces (6x6) if not provided
    >
      <div className="piece-content">
        {piece.content} {/* Fallback content if no image */}
      </div>
    </PieceContainer>
  );
};