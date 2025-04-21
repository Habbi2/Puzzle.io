import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import styled from 'styled-components';
import { PuzzlePiece as PuzzlePieceType } from '../types/game';

interface PieceContainerProps {
  $isDragging: boolean;
  $isCorrect: boolean;
  $backgroundImage?: string;
  $correctPosition: number;
  $totalPieces: number;
  $isTouching: boolean;
  $isAnimating: boolean;
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
  box-shadow: ${props => {
    if (props.$isDragging) return 'var(--shadow-lg)';
    if (props.$isTouching) return 'var(--shadow-md), 0 0 0 3px var(--color-accent-secondary)';
    return 'var(--shadow-sm)';
  }};
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s;
  position: relative;
  overflow: hidden;
  transform: ${props => {
    if (props.$isDragging) return 'scale(1.05)';
    if (props.$isTouching) return 'scale(1.02)';
    if (props.$isAnimating) return 'translateY(-2px)';
    return 'none';
  }};
  touch-action: none; /* Prevents scrolling while dragging on touch devices */
  user-select: none; /* Prevents text selection during drag */
  
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
    transform: ${props => (props.$isDragging || props.$isTouching ? 'none' : 'translateY(-2px)')};
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
  
  /* Accessibility improvement */
  &:focus-visible {
    outline: 3px solid var(--color-accent-secondary);
    outline-offset: 2px;
    z-index: 10;
  }
  
  @media (max-width: 768px) {
    /* Make pieces slightly bigger on mobile for better touch targets */
    .piece-content {
      font-size: 0.9rem;
    }
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
  const [isTouching, setIsTouching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // Using this variable in the render function
  const [isHovering, setIsHovering] = useState(false);
  
  // Set up drag functionality
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.PUZZLE_PIECE,
    item: { id: piece.id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // Animation when the piece is dropped
      if (monitor.didDrop()) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }
  });
  
  // Set up drop functionality - IMPROVED to only swap on drop, not hover
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PUZZLE_PIECE,
    hover: (item: { id: string; index: number }, monitor) => {
      // Only proceed if it's a different piece
      if (item.index === index) {
        setIsHovering(false);
        return;
      }
      
      // Calculate position for mobile dragging improvements
      if (ref.current) {
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        
        // Calculate middle points but only use them for visual feedback
        // These calculations help with mobile experience feedback
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        
        // Get mouse/touch position
        const clientOffset = monitor.getClientOffset();
        
        if (clientOffset) {
          // Get position within the element
          const hoverClientX = clientOffset.x - hoverBoundingRect.left;
          const hoverClientY = clientOffset.y - hoverBoundingRect.top;
          
          // Visual feedback based on position
          const isCloseToCenter = Math.abs(hoverClientX - hoverMiddleX) < 20 && 
                                  Math.abs(hoverClientY - hoverMiddleY) < 20;
                                  
          setIsHovering(true);
          
          // Enhanced visual feedback when close to center (not used now but useful for future)
          if (isCloseToCenter) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 100);
          }
        }
      }
    },
    drop: (item: { id: string; index: number }) => {
      // Only move if it's a different piece
      if (item.index === index) {
        return;
      }
      
      // Actually perform the piece swap only when dropped
      movePiece(item.index, index);
      
      // Reset hover state
      setIsHovering(false);
      
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });
  
  // Reference to the DOM node
  const ref = React.useRef<HTMLDivElement>(null);
  
  // Combine drag and drop refs
  const dragDropRef = (el: HTMLDivElement) => {
    ref.current = el;
    drag(el);
    drop(el);
    preview(el);
  };
  
  // Touch event handlers for better mobile experience
  const handleTouchStart = () => {
    setIsTouching(true);
  };
  
  const handleTouchEnd = () => {
    setIsTouching(false);
  };
  
  // Function to handle keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Initiate drag or drop action
      e.preventDefault();
      if (!isDragging) {
        // In a real implementation, we would need custom keyboard navigation
        // For now, we'll just provide feedback
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }
  };
  
  return (
    <PieceContainer 
      ref={dragDropRef}
      $isDragging={isDragging}
      $isCorrect={isCorrect}
      $backgroundImage={puzzleImage || undefined}
      $correctPosition={piece.correctPosition}
      $totalPieces={totalPieces || 36}
      $isTouching={isTouching || isOver || isHovering} // Include isHovering in the conditional
      $isAnimating={isAnimating}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0} // Make the piece focusable for keyboard navigation
      role="button"
      aria-label={`Puzzle piece ${piece.content}, position ${index + 1}`}
      data-testid={`puzzle-piece-${piece.id}`}
    >
      <div className="piece-content">
        {piece.content} {/* Fallback content if no image */}
      </div>
    </PieceContainer>
  );
};