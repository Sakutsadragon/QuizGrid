const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("Connected to MongoDB successfully."))
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });

// Middleware
app.use(express.json());

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", gameRoutes);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ roomId, userId, username }) => {
    if (!userId || !username) {
      socket.emit("error", { message: "Authentication required" });
      return;
    }

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: new Map(),
        currentTurn: null,
        gameActive: false,
        usedCells: new Set(),
        cellOwnership: Array(25).fill(null),
        timerStart: null,
        quizData: null,
      };
    }

    if (rooms[roomId].gameActive && !rooms[roomId].players.has(userId)) {
      socket.emit("error", { message: "Game is already in progress." });
      return;
    }

    socket.join(roomId);
    rooms[roomId].players.set(userId, {
      socketId: socket.id,
      username,
      score: 0,
    });

    socket.to(roomId).emit("playerJoined", { userId, username });

    const playersArray = Array.from(rooms[roomId].players.entries());

    if (playersArray.length === 2 && !rooms[roomId].gameActive) {
      rooms[roomId].gameActive = true;
      const [hostId] = playersArray[0];
      rooms[roomId].currentTurn = hostId;
      io.to(roomId).emit("gameStarted", {
        players: playersArray.map(([id, data]) => ({
          userId: id,
          username: data.username,
          score: data.score,
        })),
        currentTurn: hostId,
        cellOwnership: rooms[roomId].cellOwnership,
      });
    } else if (playersArray.length === 2) {
      io.to(roomId).emit("updatePlayers", {
        players: playersArray.map(([id, data]) => ({
          userId: id,
          username: data.username,
          score: data.score,
        })),
        currentTurn: rooms[roomId].currentTurn,
        cellOwnership: rooms[roomId].cellOwnership,
      });
    }
  });

  socket.on("cellClick", ({ roomId, index }) => {
    const room = rooms[roomId];
    const playerId = Array.from(room.players.entries()).find(
      ([id, p]) => p.socketId === socket.id
    )?.[0];
    if (!room || !room.gameActive || room.currentTurn !== playerId) return;
    room.usedCells.add(index);
    io.to(roomId).emit("cellClick", { index, currentTurn: room.currentTurn });
  });

  socket.on('submitAnswer', ({ roomId, cellIndex, isCorrect, playerId, nextTurn }) => {
    const room = rooms[roomId];
    if (!room || !room.gameActive) return;

      const currentPlayer = room.players.get(playerId);
      if (!currentPlayer || currentPlayer.socketId !== socket.id) return;

      const isHost = playerId === Array.from(room.players.keys())[0];
      const owner = isCorrect ? (isHost ? "P" : "C") : isHost ? "C" : "P";
      room.cellOwnership[cellIndex] = owner;
      if (isCorrect) {
        currentPlayer.score += 1;
      } else {
        const opponentId = Array.from(room.players.keys()).find(
          (id) => id !== playerId
        );
        if (opponentId) room.players.get(opponentId).score += 1;
      }

      io.to(roomId).emit("updateOwnership", { cellIndex, owner });
      io.to(roomId).emit("updatePlayers", {
        players: Array.from(room.players.entries()).map(([id, data]) => ({
          userId: id,
          username: data.username,
          score: data.score,
        })),
        currentTurn: room.currentTurn,
        cellOwnership: room.cellOwnership,
      });

    room.currentTurn = nextTurn;
    io.to(roomId).emit('updateTurn', { currentTurn: nextTurn });
    checkWinCondition(room, roomId);
  });

  socket.on('questionFetched', ({ roomId, question, options, correctAnswer }) => {
    io.to(roomId).emit('questionFetched', { question, options, currentTurn: rooms[roomId]?.currentTurn, correctAnswer });
  });

  const checkWinCondition = (room, roomId) => {
    const players = Array.from(room.players.entries());
    const finalScores = players.map(([id, data]) => ({
      userId: id,
      username: data.username,
      score: data.score,
    }));

    for (const { userId, username, score } of finalScores) {
      if (score >= 13) {
        room.gameActive = false;
        const message = `Game over in room ${roomId}. ${username} won by reaching 13 points!`;
        io.to(roomId).emit("gameOver", {
          winner: userId,
          finalScores,
          message,
        });
        return;
      }
    }
    const patterns = [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24],
      [0, 5, 10, 15, 20],
      [1, 6, 11, 16, 21],
      [2, 7, 12, 17, 22],
      [3, 8, 13, 18, 23],
      [4, 9, 14, 19, 24],
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20],
    ];

    for (const pattern of patterns) {
      if (
        pattern.every((i) => room.cellOwnership[i] === "P") ||
        pattern.every((i) => room.cellOwnership[i] === "C")
      ) {
        room.gameActive = false;
        const winnerOwner = room.cellOwnership[pattern[0]];
        const winnerIndex = winnerOwner === "P" ? 0 : 1;
        const players = Array.from(room.players.entries());
        const winnerId = Array.from(room.players.keys())[winnerIndex];
        const finalScores = players.map(([id, data]) => ({
          userId: id,
          username: data.username,
          score: data.score,
        }));
        const message = `Game over in room ${roomId}. Winner: ${
          room.players.get(winnerId).username
        }`;
        io.to(roomId).emit("gameOver", {
          winner: winnerId,
          finalScores,
          message,
        });
        return;
      }
    }

    if (room.usedCells.size === 25) {
      room.gameActive = false;
      const winner = finalScores[0].score >= finalScores[1].score ? finalScores[0] : finalScores[1];
      const message = `Game over in room ${roomId}. Grid full. Winner: ${winner.username}`;
      io.to(roomId).emit("gameOver", {
        winner: winner.userId,
        finalScores,
        message,
      });
    }
  };

  socket.on("restartGame", (roomId) => {
    const room = rooms[roomId];
    if (room && !room.gameActive) {
      room.players.clear();
      room.usedCells.clear();
      room.cellOwnership = Array(25).fill(null);
      room.gameActive = false;
      room.currentTurn = null;
      room.timerStart = null;
      room.quizData = null;
      io.to(roomId).emit("gameStarted", {
        players: [],
        currentTurn: null,
        cellOwnership: room.cellOwnership,
      });
    }
  });

  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      const room = rooms[roomId];
      const userEntry = Array.from(room.players.entries()).find(
        ([_, data]) => data.socketId === socket.id
      );
      if (userEntry) {
        const [userId, userData] = userEntry;
        room.players.delete(userId);
        io.to(roomId).emit("playerLeft", {
          userId,
          username: userData.username,
        });
        if (room.players.size < 2 && room.gameActive) {
          room.gameActive = false;
          io.to(roomId).emit("gameEnded", {
            message: "Game ended due to player disconnection",
          });
        }
      }
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error.message);
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
