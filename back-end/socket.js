// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:5173', // Adjust based on your frontend URL
//     methods: ['GET', 'POST'],
//   },
// });

// const rooms = {}; // Object to track players per room

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   socket.on('joinRoom', ({ roomId, userId }) => {
//     socket.join(roomId);

//     // Initialize room if it doesn't exist
//     if (!rooms[roomId]) {
//       rooms[roomId] = new Set();
//     }
//     rooms[roomId].add(userId);

//     // Broadcast to room that a player joined
//     socket.to(roomId).emit('playerJoined', userId);

//     // Check if two players are present
//     if (rooms[roomId].size === 2) {
//       io.to(roomId).emit('gameStarted'); // Notify all clients in the room
//     }
//   });

//   socket.on('cellClick', ({ roomId, index }) => {
//     socket.to(roomId).emit('cellClick', { index });
//   });

//   socket.on('updateOwnership', ({ roomId, cellIndex, owner }) => {
//     socket.to(roomId).emit('updateOwnership', { cellIndex, owner });
//   });

//   socket.on('submitAnswer', ({ roomId, cellIndex, isCorrect, playerId }) => {
//     socket.to(roomId).emit('submitAnswer', { cellIndex, isCorrect, playerId });
//   });

//   socket.on('questionFetched', ({ roomId, question, options }) => {
//     socket.to(roomId).emit('questionFetched', { question, options });
//   });

//   socket.on('gameOver', ({ roomId, winner, finalScore }) => {
//     io.to(roomId).emit('gameOver', { winner, finalScore });
//   });

//   socket.on('restartGame', (roomId) => {
//     if (rooms[roomId]) {
//       rooms[roomId].clear(); // Reset room players
//       io.to(roomId).emit('gameStarted'); // Re-trigger game start logic
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//     // Remove user from all rooms and notify if needed
//     for (let roomId in rooms) {
//       if (rooms[roomId].has(socket.id)) {
//         rooms[roomId].delete(socket.id);
//         io.to(roomId).emit('playerLeft', socket.id);
//         if (rooms[roomId].size < 2) {
//           io.to(roomId).emit('gameEnded'); // End game if player leaves
//         }
//       }
//     }
//   });
// });

// const PORT = process.env.PORT || 8000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// module.exports = io;