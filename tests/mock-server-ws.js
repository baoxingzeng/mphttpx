import { WebSocketServer } from "ws";

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });
console.log(`Mock WebSocket server started: ws://localhost:${PORT}`);

wss.on("connection", ws => {
    ws.on("message", (data, isBinary) => {
        if (!isBinary) {
            const message = data.toString();
            console.log("Received: ", message);

            switch (message) {
                case "ping":
                    ws.send("pong");
                    break;
                case "close":
                    ws.close(1000, "normal close");
                    break;
                case "error":
                    ws.close(1011, "server error");
                    break;
                default:
                    ws.send(`echo: ${message}`);
            }
        } else {
            ws.send(data, { binary: true });
        }
    });

    ws.on("close", (code, reason) => {
        console.log(`close: code=${code}, reason=${reason}`);
    });

    ws.on("error", (error) => {
        console.error("WebSocket Error: ", error);
    });

    ws.send("Welcome to test server!");
});

export default wss;
