import { io } from "socket.io-client";

// In dev, Vite proxies /socket.io to the backend when VITE_API_URL is empty.
// In production, set VITE_API_URL to the deployed backend origin if needed.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SOCKET_URL = API_ORIGIN || "/";
const DEBUG_API = import.meta.env.VITE_DEBUG_API === "true";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ["polling", "websocket"],
});

if (DEBUG_API) {
  console.debug("[socket] initializing", { url: SOCKET_URL });

  socket.on("connect", () => {
    console.debug("[socket] connected", {
      id: socket.id,
      url: SOCKET_URL,
      transport: socket.io.engine.transport.name,
    });
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error", {
      url: SOCKET_URL,
      message: err.message,
    });
  });

  socket.on("disconnect", (reason) => {
    console.debug("[socket] disconnected", { reason });
  });
}

export default socket;
