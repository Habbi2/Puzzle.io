"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
// Game state management
const games = new Map();
const usernames = new Map();
const roomStates = new Map(); // Track game room properties
// Generate a dynamic puzzle with different piece counts based on difficulty
const generatePuzzle = (difficulty = 'medium') => {
    // Determine grid size based on difficulty
    let rows, cols;
    switch (difficulty) {
        case 'easy':
            rows = cols = 4; // 16 pieces (4x4)
            break;
        case 'medium':
            rows = cols = 6; // 36 pieces (6x6)
            break;
        case 'hard':
            rows = cols = 8; // 64 pieces (8x8)
            break;
        default:
            rows = cols = 6; // Default to medium
    }
    const totalPieces = rows * cols;
    const pieces = [];
    // Create the puzzle pieces in correct order
    for (let i = 0; i < totalPieces; i++) {
        pieces.push({
            id: `piece${i}`,
            position: i,
            correctPosition: i,
            content: `${i}`
        });
    }
    // Shuffle the positions (Fisher-Yates algorithm)
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap positions (not the correctPosition)
        [pieces[i].position, pieces[j].position] = [pieces[j].position, pieces[i].position];
    }
    return pieces;
};
const setupSocketHandlers = (io) => {
    // Socket.io event handlers
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        // Handle player joining a game
        socket.on('join_game', ({ gameId, username }) => {
            // If username is not provided, generate one
            const playerName = username || `Player${Math.floor(Math.random() * 1000)}`;
            usernames.set(socket.id, playerName);
            // Join the socket room for this game
            socket.join(gameId);
            // Create or update game state
            if (!games.has(gameId)) {
                // Set default difficulty for new games
                const defaultDifficulty = 'medium';
                roomStates.set(gameId, { difficulty: defaultDifficulty });
                // Create a new game
                games.set(gameId, {
                    id: gameId,
                    players: [{ id: socket.id, username: playerName }],
                    puzzle: generatePuzzle(defaultDifficulty),
                    startTime: new Date(),
                    completed: false,
                    puzzleImage: null // Initialize with no puzzle image
                });
            }
            else {
                // Add player to existing game
                const game = games.get(gameId);
                game.players.push({ id: socket.id, username: playerName });
            }
            // Send current game state to all players in this game
            io.to(gameId).emit('game_state', games.get(gameId));
            // Notify all players about the new player
            io.to(gameId).emit('player_joined', { playerId: socket.id, username: playerName });
            // Send a welcome message to the chat
            const welcomeMessage = {
                sender: 'System',
                message: `${playerName} has joined the game`,
                timestamp: Date.now()
            };
            io.to(gameId).emit('new_message', welcomeMessage);
        });
        // Handle piece movement
        socket.on('move_piece', ({ gameId, pieceId, newPosition }) => {
            if (!games.has(gameId))
                return;
            const game = games.get(gameId);
            // Find the moved piece
            const pieceIndex = game.puzzle.findIndex((piece) => piece.id === pieceId);
            if (pieceIndex !== -1) {
                const currentPosition = game.puzzle[pieceIndex].position;
                // Don't process if the piece is already at the target position
                if (currentPosition === newPosition)
                    return;
                // Find the piece currently at the destination
                const destPieceIndex = game.puzzle.findIndex((piece) => piece.position === newPosition);
                if (destPieceIndex !== -1) {
                    // Swap positions
                    game.puzzle[pieceIndex].position = newPosition;
                    game.puzzle[destPieceIndex].position = currentPosition;
                    // Broadcast the updated game state to all players
                    io.to(gameId).emit('game_state', game);
                    // Check if the puzzle is solved
                    const isSolved = game.puzzle.every((piece) => piece.position === piece.correctPosition);
                    if (isSolved && !game.completed) {
                        game.completed = true;
                        // Send puzzle solved event to all players
                        io.to(gameId).emit('puzzle_solved', {
                            gameId,
                            solvedBy: usernames.get(socket.id) || 'Unknown player',
                            timeElapsed: Date.now() - game.startTime.getTime(),
                        });
                        // Also send a congratulatory message to the chat
                        const solvedMessage = {
                            sender: 'System',
                            message: `🎉 Puzzle solved by ${usernames.get(socket.id) || 'Unknown player'}!`,
                            timestamp: Date.now()
                        };
                        io.to(gameId).emit('new_message', solvedMessage);
                    }
                }
            }
        });
        // Handle player leaving
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // Remove player from all games they were part of
            for (const [gameId, game] of games.entries()) {
                const playerIndex = game.players.findIndex((player) => player.id === socket.id);
                if (playerIndex !== -1) {
                    const playerName = usernames.get(socket.id) || 'Unknown player';
                    // Remove the player
                    game.players.splice(playerIndex, 1);
                    // If no players left, clean up the game after a delay
                    // This gives players a chance to reconnect in case of network issues
                    if (game.players.length === 0) {
                        setTimeout(() => {
                            // Double-check that the game is still empty
                            const currentGame = games.get(gameId);
                            if (currentGame && currentGame.players.length === 0) {
                                games.delete(gameId);
                                roomStates.delete(gameId);
                                console.log(`Game ${gameId} removed due to inactivity`);
                            }
                        }, 60000); // 1 minute delay before cleanup
                    }
                    else {
                        // Otherwise notify remaining players
                        io.to(gameId).emit('player_left', {
                            playerId: socket.id,
                            username: playerName
                        });
                        // Send a message to the chat
                        const leaveMessage = {
                            sender: 'System',
                            message: `${playerName} has left the game`,
                            timestamp: Date.now()
                        };
                        io.to(gameId).emit('new_message', leaveMessage);
                        // Also update game state for remaining players
                        io.to(gameId).emit('game_state', game);
                    }
                }
            }
            // Clean up username
            usernames.delete(socket.id);
        });
        // Handle chat messages
        socket.on('send_message', ({ gameId, message }) => {
            const username = usernames.get(socket.id) || 'Unknown player';
            io.to(gameId).emit('new_message', {
                sender: username,
                message,
                timestamp: Date.now()
            });
        });
        // Handle game reset
        socket.on('reset_game', ({ gameId }) => {
            if (!games.has(gameId))
                return;
            const game = games.get(gameId);
            const roomState = roomStates.get(gameId) || { difficulty: 'medium' };
            // Use the room's current difficulty setting
            game.puzzle = generatePuzzle(roomState.difficulty);
            game.startTime = new Date();
            game.completed = false;
            // Keep the puzzle image when resetting
            // Send game state update to all players
            io.to(gameId).emit('game_state', game);
            // Send a notification to the chat about the reset
            const resetMessage = {
                sender: 'System',
                message: `${usernames.get(socket.id) || 'Someone'} reset the puzzle. New puzzle ready!`,
                timestamp: Date.now()
            };
            io.to(gameId).emit('new_message', resetMessage);
        });
        // Handle setting puzzle image
        socket.on('set_puzzle_image', ({ gameId, imageUrl }) => {
            if (!games.has(gameId))
                return;
            const game = games.get(gameId);
            const roomState = roomStates.get(gameId) || { difficulty: 'medium' };
            game.puzzleImage = imageUrl;
            console.log(`Puzzle image set for game ${gameId}`);
            // Generate a new puzzle when the image is set - this ensures players start fresh
            game.puzzle = generatePuzzle(roomState.difficulty);
            game.startTime = new Date();
            game.completed = false;
            // Update all clients with the new game state
            io.to(gameId).emit('game_state', game);
            // Send a notification to the chat
            const newImageMessage = {
                sender: 'System',
                message: `${usernames.get(socket.id) || 'Someone'} set a new puzzle image. Puzzle ready!`,
                timestamp: Date.now()
            };
            io.to(gameId).emit('new_message', newImageMessage);
        });
        // Handle updating difficulty
        socket.on('update_difficulty', ({ gameId, difficulty }) => {
            if (!games.has(gameId))
                return;
            // Update the room state with the new difficulty
            roomStates.set(gameId, Object.assign(Object.assign({}, (roomStates.get(gameId) || {})), { difficulty }));
            // Generate a new puzzle with the selected difficulty
            const game = games.get(gameId);
            game.puzzle = generatePuzzle(difficulty);
            game.startTime = new Date();
            game.completed = false;
            // Broadcast the game state update to all players
            io.to(gameId).emit('game_state', game);
            // Send a notification about the difficulty change
            const difficultyMessage = {
                sender: 'System',
                message: `${usernames.get(socket.id) || 'Someone'} changed the difficulty to ${difficulty}`,
                timestamp: Date.now()
            };
            io.to(gameId).emit('new_message', difficultyMessage);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
