import { useContext } from "react";
import OnlineContext from "../Context/onlineContextValue";

/* Returns a Set<string> of currently-online user IDs. */
export const useOnlineUsers = () => useContext(OnlineContext);
