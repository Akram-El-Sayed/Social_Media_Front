import React, { useEffect, useState } from "react";
import OnlineContext from "./onlineContextValue";
import { useSocket } from "../Hooks/useSocket";

export function OnlineProvider({ children }) {
  // Destructure isConnected from your hook
  const { socket, isConnected } = useSocket(); 
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Only run logic if socket exists AND is connected
    if (!socket || !isConnected) return;

    // Request the full list from the server immediately on connect
    socket.emit("request_online_users");

    const handleInitialList = (users) => {
      // Ensure IDs are strings to match your Set logic
      setOnlineUsers(new Set(users.map(id => id.toString())));
    };

    const handleOnline = ({ userId }) =>
      setOnlineUsers((prev) => new Set([...prev, userId.toString()]));

    const handleOffline = ({ userId }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId.toString());
        return next;
      });

    // Listeners
    socket.on("online_users_list", handleInitialList);
    socket.on("user:online", handleOnline);
    socket.on("user:offline", handleOffline);

    return () => {
      socket.off("online_users_list", handleInitialList);
      socket.off("user:online", handleOnline);
      socket.off("user:offline", handleOffline);
    };
  }, [socket, isConnected]); 

  return (
    <OnlineContext.Provider value={onlineUsers}>
      {children}
    </OnlineContext.Provider>
  );
}
