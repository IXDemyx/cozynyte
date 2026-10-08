/** HTTP-Server, Socket.IO und – im Produktivbetrieb – das gebaute Frontend. */

import express from "express";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { rooms } from "./state";

const app = express();

export const http = createServer(app);
export const io = new Server(http, { cors: { origin: true } });

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}
