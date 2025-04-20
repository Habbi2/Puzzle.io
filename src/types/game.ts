// Type definitions for the puzzle game

export interface Player {
  id: string;
  username: string;
}

export interface PuzzlePiece {
  id: string;
  position: number;      // Current position in the puzzle
  correctPosition: number; // Position where it should be when solved
  content: string;       // Content of the piece (emoji, image URL, etc.)
}

export interface GameState {
  id: string;
  players: Player[];
  puzzle: PuzzlePiece[];
  startTime: Date;
  completed: boolean;
  puzzleImage: string | null; // URL of the puzzle image
}

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}