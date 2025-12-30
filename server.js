import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
// ১. HTTP Server তৈরি (Socket.io এর জন্য প্রয়োজন)
const server = http.createServer(app);

// ২. Socket.io কনফিগারেশন
const io = new Server(server, {
  cors: {
    origin: [
      "https://task-manager-backend-tqcv.onrender.com/",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
});

// Middleware to handle cors
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

// ৩. চ্যাট লজিক (Socket Connection)
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // ইউজার কানেক্ট হলে তার ID সেভ করা
  socket.on("addUser", (userId) => {
    if (userId && !onlineUsers.find((u) => u.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    io.emit("getOnlineUsers", onlineUsers);
  });

  // মেসেজ আদান-প্রদান
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    const receiver = onlineUsers.find((u) => u.userId === receiverId);
    if (receiver) {
      // রিসিভার অনলাইনে থাকলে সরাসরি পাঠানো
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        message,
      });
    }
  });

  // ডিসকানেক্ট হলে লিস্ট থেকে রিমুভ করা
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
    console.log("User disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Task Manager API is running");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
