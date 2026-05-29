import { createContext } from "react";

// Plain JS — not a component file, so react-refresh has no opinion about it.
const OnlineContext = createContext(new Set());

export default OnlineContext;
