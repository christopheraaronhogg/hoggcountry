import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { TrailRoom } from "./rooms/TrailRoom";
import path from "path";

const port = Number(process.env.PORT) || 2567;
const app = express();

// Serve static files from client build (for production)
app.use(express.static(path.join(__dirname, "../../client/dist")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", game: "Trail Legs", version: "0.1.0" });
});

const server = createServer(app);
const gameServer = new Server({ server });

// Register game room
gameServer.define("trail", TrailRoom);

gameServer.listen(port);

console.log(`
╔════════════════════════════════════════╗
║         TRAIL LEGS SERVER              ║
║     Appalachian Trail Simulation       ║
╠════════════════════════════════════════╣
║  Server running on port ${port}            ║
║  WebSocket: ws://localhost:${port}         ║
║  Health: http://localhost:${port}/health   ║
╚════════════════════════════════════════╝
`);
