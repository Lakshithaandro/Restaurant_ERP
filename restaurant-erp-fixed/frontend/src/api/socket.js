import { io } from "socket.io-client";

// Connects to the backend; in dev the Vite proxy forwards the websocket.
const socket = io(import.meta.env.VITE_API_URL || "/", {
  autoConnect: true,
});

export default socket;
