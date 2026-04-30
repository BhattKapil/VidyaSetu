import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import quizRoutes from "./routes/quiz.js";
import userRoutes from "./routes/user.js";
import aiRoutes from "./routes/ai.js";
import emailRoutes from "./routes/email.js";

dotenv.config({ path: "../.env" });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:8080", methods: ["GET", "POST"] }
});

app.use(cors({
  origin: "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/email", emailRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// WebSocket for live quiz
const rooms = {};
io.on("connection", (socket) => {
  socket.on("join-room", ({ code, player }) => {
    socket.join(code);
    if (!rooms[code]) rooms[code] = { players: [] };
    rooms[code].players.push(player);
    io.to(code).emit("room-update", rooms[code]);
  });

  socket.on("answer", ({ code, playerId, answer }) => {
    io.to(code).emit("player-answered", { playerId, answer });
  });

  socket.on("next-question", ({ code, questionIndex }) => {
    io.to(code).emit("question-change", { questionIndex });
  });

  socket.on("end-quiz", ({ code }) => {
    io.to(code).emit("quiz-ended");
    delete rooms[code];
  });

  socket.on("disconnect", () => {
    Object.keys(rooms).forEach(code => {
      rooms[code].players = rooms[code].players.filter(p => p.socketId !== socket.id);
      io.to(code).emit("room-update", rooms[code]);
    });
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("[VidyaSetu] MongoDB connected");
    httpServer.listen(3001, () => {
      console.log("[VidyaSetu] Backend running on http://localhost:3001");
    });
  })
  .catch(err => console.error("[VidyaSetu] MongoDB error:", err));
