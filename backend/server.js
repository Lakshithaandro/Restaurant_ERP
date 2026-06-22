import express from "express";
import "express-async-errors";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();
const DEBUG_API = process.env.DEBUG_API === "true";
await connectDB();

const app = express();
const server = http.createServer(app);

const DEFAULT_CLIENT_URLS = [
  "http://localhost:5173",
  "https://restaurant-erp-1-v70d.onrender.com",
];

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");

const parseClientUrls = () => {
  const configuredUrls = process.env.CLIENT_URLS
    ? process.env.CLIENT_URLS.split(",")
    : [...DEFAULT_CLIENT_URLS, process.env.CLIENT_URL];

  return [...new Set(configuredUrls.filter(Boolean).map(normalizeOrigin))];
};

const allowedOrigins = parseClientUrls();

const corsOrigin = (origin, callback) => {
  // Allow requests without an Origin header, such as same-origin requests,
  // Render health checks, curl, Postman, and server-to-server calls.
  if (!origin) return callback(null, true);

  if (allowedOrigins.includes(normalizeOrigin(origin))) {
    return callback(null, true);
  }

  if (DEBUG_API) {
    console.warn("[cors] blocked origin", {
      origin,
      allowedOrigins,
    });
  }

  return callback(new Error(`CORS blocked origin: ${origin}`));
};

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Socket.IO for real-time kitchen / order updates
const io = new Server(server, {
  cors: corsOptions,
  transports: ["polling", "websocket"],
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// make io available inside controllers via req.app.get("io")
app.set("io", io);

// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
  console.log(`DEBUG_API: ${DEBUG_API ? "enabled" : "disabled"}`);
});
