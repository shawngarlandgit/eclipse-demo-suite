import http from "node:http";
import crypto from "node:crypto";
import express from "express";
import { WebSocketServer, type WebSocket } from "ws";
import { z } from "zod";

const PORT = Number(process.env.PORT ?? 8787);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://127.0.0.1:5193";
const WEB_ORIGINS = process.env.WEB_ORIGINS ?? WEB_ORIGIN;
const ADMIN_KEY = process.env.ADMIN_KEY ?? "";

type Role = "provider" | "patient";

type Room = {
  roomId: string;
  createdAt: number;
  providerToken: string;
  patientToken: string;
  sharedKey: string;
};

type RoomPeers = {
  provider?: WebSocket;
  patient?: WebSocket;
};

const rooms = new Map<string, Room>();
const peersByRoom = new Map<string, RoomPeers>();
const pendingSignalsByRoom = new Map<string, { provider: unknown[]; patient: unknown[] }>();

function getPending(roomId: string) {
  let p = pendingSignalsByRoom.get(roomId);
  if (!p) {
    p = { provider: [], patient: [] };
    pendingSignalsByRoom.set(roomId, p);
  }
  return p;
}

function randomId(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

function getRoleForToken(room: Room, token: string): Role | null {
  if (token === room.providerToken) return "provider";
  if (token === room.patientToken) return "patient";
  return null;
}

function send(ws: WebSocket, msg: unknown) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
}

function safeClose(ws: WebSocket, code: number, reason: string) {
  try {
    ws.close(code, reason);
  } catch {
    // ignore
  }
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  // CORS allowlist (comma-separated), ex:
  // WEB_ORIGINS="http://127.0.0.1:5193,http://localhost:5173,https://admin.example.com"
  // WEB_ORIGINS="*" (dev only)
  const allowAll = WEB_ORIGINS.split(",").map((s) => s.trim()).includes("*");
  const allow = new Set([
    ...WEB_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
    // common local dev origins
    "http://localhost:5193",
    "http://127.0.0.1:5193",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5177",
    "http://127.0.0.1:5177",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    // medcard standalone + kiosk scanner
    "http://localhost:5187",
    "http://127.0.0.1:5187",
    "http://localhost:5182",
    "http://127.0.0.1:5182"
  ]);
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  if (origin && (allowAll || allow.has(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", WEB_ORIGIN);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/rooms", (_req, res) => {
  if (ADMIN_KEY) {
    const got = String(_req.headers["x-admin-key"] ?? "");
    if (got !== ADMIN_KEY) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }

  const roomId = randomId(12);
  const providerToken = randomId(18);
  const patientToken = randomId(18);

  const createdAt = Date.now();
  const sharedKey = randomId(18);
  rooms.set(roomId, { roomId, createdAt, providerToken, patientToken, sharedKey });

  res.json({
    roomId,
    providerToken,
    patientToken,
    sharedKey,
    expiresInSeconds: 60 * 60 * 24
  });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

type ConnState = {
  roomId: string | null;
  role: Role | null;
};

const JoinMsgSchema = z.object({
  type: z.literal("join"),
  roomId: z.string().min(1),
  token: z.string().min(1)
});

const SignalMsgSchema = z.object({
  type: z.literal("signal"),
  data: z.unknown()
});

wss.on("connection", (ws) => {
  const state: ConnState = { roomId: null, role: null };

  ws.on("message", (raw) => {
    let msg: unknown;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      safeClose(ws, 1003, "invalid json");
      return;
    }

    if (state.roomId == null || state.role == null) {
      const parsed = JoinMsgSchema.safeParse(msg);
      if (!parsed.success) {
        safeClose(ws, 1008, "must join first");
        return;
      }

      const room = rooms.get(parsed.data.roomId);
      if (!room) {
        safeClose(ws, 1008, "unknown room");
        return;
      }

      const role = getRoleForToken(room, parsed.data.token);
      if (!role) {
        safeClose(ws, 1008, "bad token");
        return;
      }

      state.roomId = room.roomId;
      state.role = role;

      const peers = peersByRoom.get(room.roomId) ?? {};
      // Best practice for real-world calls: allow reconnects.
      // If the same role reconnects (same bearer token), replace the old socket ("last connection wins")
      // so backgrounded mobile tabs or flaky networks don't permanently lock the room.
      if (peers[role]) {
        safeClose(peers[role]!, 4001, "replaced by new connection");
      }

      peers[role] = ws;
      peersByRoom.set(room.roomId, peers);

      send(ws, { type: "joined", roomId: room.roomId, role });

      const otherRole: Role = role === "provider" ? "patient" : "provider";
      const other = peers[otherRole];
      if (other) {
        send(ws, { type: "peer", status: "connected", role: otherRole });
        send(other, { type: "peer", status: "connected", role });
      } else {
        send(ws, { type: "peer", status: "waiting", role: otherRole });
      }

      // Flush any queued signals targeted to this role.
      const pending = pendingSignalsByRoom.get(room.roomId);
      if (pending) {
        const queued = pending[role];
        pending[role] = [];
        for (const data of queued) {
          send(ws, { type: "signal", data });
        }
      }

      return;
    }

    const signal = SignalMsgSchema.safeParse(msg);
    if (!signal.success) return;

    const roomId = state.roomId;
    const role = state.role;
    const peers = roomId ? peersByRoom.get(roomId) : undefined;
    if (!roomId || !role || !peers) return;

    const otherRole: Role = role === "provider" ? "patient" : "provider";
    const other = peers[otherRole];
    if (other) {
      // Forward only the payload (signal.data.data), not the wrapper.
      send(other, { type: "signal", data: signal.data.data });
      return;
    }

    // Other side not connected yet, queue the signal.
    getPending(roomId)[otherRole].push(signal.data.data);
  });

  ws.on("close", () => {
    if (!state.roomId || !state.role) return;
    const peers = peersByRoom.get(state.roomId);
    if (!peers) return;

    if (peers[state.role] === ws) {
      delete peers[state.role];
    }

    const otherRole: Role = state.role === "provider" ? "patient" : "provider";
    const other = peers[otherRole];
    if (other) send(other, { type: "peer", status: "disconnected", role: state.role });

    if (!peers.provider && !peers.patient) {
      peersByRoom.delete(state.roomId);
      // room itself expires by TTL; keep it for reconnection.
    }
  });
});

setInterval(() => {
  const now = Date.now();
  const ttlMs = 24 * 60 * 60 * 1000;
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > ttlMs) {
      rooms.delete(roomId);
      peersByRoom.delete(roomId);
      pendingSignalsByRoom.delete(roomId);
    }
  }
}, 60 * 1000).unref();

server.listen(PORT, () => {
  // Avoid logging tokens.
  console.log(`secure-call signaling server listening on http://localhost:${PORT}`);
});
