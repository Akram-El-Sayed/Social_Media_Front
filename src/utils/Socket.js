import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000"; // dev-only fallback

let socket = null;
let listeners = new Set(); // Keep track of React components to update

// Notify all subscribers
const emitChange = () => {
  const status = socket?.connected || false;
  listeners.forEach((listener) => listener(status));
};

export const connectSocket = () => {
  if (socket) return socket;

  const token = localStorage.getItem("token"); 

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    auth: { token },
  });

  // Attach status listeners
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    emitChange();
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
    emitChange();
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
    emitChange();
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    emitChange();
  }
};

export const getSocket = () => socket;

// Helper for the custom hook to subscribe to status changes
export const subscribeToStatus = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback); // Unsubscribe function
};
