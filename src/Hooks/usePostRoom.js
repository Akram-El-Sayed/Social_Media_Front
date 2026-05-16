import { useEffect } from "react";
import { useSocket } from "./useSocket";

export const usePostRoom = (postId) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !postId) return;

    const id = postId.toString();
    socket.emit("join_post", id);

    return () => {
      socket.emit("leave_post", id);
    };
  }, [socket, isConnected, postId]);

  return { socket, isConnected };
};
