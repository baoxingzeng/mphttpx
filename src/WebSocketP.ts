import { WebSocketImpl as WebSocketMP } from "./mini-program/WebSocketImpl";

export const WebSocketP = WebSocketMP;

const WebSocketE = (typeof WebSocket !== "undefined" && WebSocket) || WebSocketP;
export { WebSocketE as WebSocket };
