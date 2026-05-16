import { useState, useEffect } from "react";
import { getSocket, subscribeToStatus } from "../utils/Socket";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(getSocket()?.connected || false);

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = subscribeToStatus((status) => {
      setIsConnected(status);
    });
    return () => unsubscribe();
  }, []);

  return {
    socket: getSocket(),
    isConnected
  };
};