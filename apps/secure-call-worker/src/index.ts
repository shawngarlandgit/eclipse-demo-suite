/* eslint-disable no-console */
/**
 * Cloudflare Worker + Durable Object signaling server for Secure Call.
 *
 * Endpoints:
 * - POST /api/rooms  -> create a roomId + provider/patient tokens + sharedKey
 * - GET  /health     -> ok
 * - WS   /ws         -> websocket signaling channel (client sends {type:"join", roomId, token})
 *
 * This is intentionally minimal (demo-first), but stable enough to power
 * iPad-only demos without relying on a local tunnel.
 */

type Role = "provider" | "patient";

type Room = {
  roomId: string;
  createdAt: number;
  providerToken: string;
  patientToken: string;
  sharedKey: string;
};

type ConnState = {
  roomId: string | null;
  role: Role | null;
};

type Env = {
  SIGNALING: DurableObjectNamespace<Signaling>;
  ADMIN_KEY: string;
  WEB_ORIGINS: string;
};

function json(res: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(res), { ...init, headers });
}

function randomHex(bytes = 16): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

function corsHeaders(req: Request, env: Env): Headers {
  const h = new Headers();
  const origin = req.headers.get("origin") || "";
  const allow = String(env.WEB_ORIGINS || "").trim();
  const allowAll = allow.split(",").map((s) => s.trim()).includes("*");
  if (allowAll) {
    h.set("access-control-allow-origin", origin || "*");
  } else {
    const set = new Set(allow.split(",").map((s) => s.trim()).filter(Boolean));
    if (origin && set.has(origin)) h.set("access-control-allow-origin", origin);
  }
  h.set("vary", "Origin");
  h.set("access-control-allow-methods", "GET,POST,OPTIONS");
  h.set("access-control-allow-headers", "Content-Type, X-Admin-Key");
  return h;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    // Single DO instance handles all rooms.
    const id = env.SIGNALING.idFromName("global");
    const stub = env.SIGNALING.get(id);

    // Preflight is handled in the DO, but short-circuit here to reduce load.
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req, env) });
    }

    // Forward everything to the DO.
    const forward = new Request(url.toString(), req);
    return await stub.fetch(forward);
  },
};

export class Signaling implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly env: Env;

  // In-memory state (DO instance is single-threaded; good for signaling).
  private rooms = new Map<string, Room>();
  private peersByRoom = new Map<string, { provider?: WebSocket; patient?: WebSocket }>();
  private pendingSignalsByRoom = new Map<string, { provider: unknown[]; patient: unknown[] }>();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private getPending(roomId: string) {
    let p = this.pendingSignalsByRoom.get(roomId);
    if (!p) {
      p = { provider: [], patient: [] };
      this.pendingSignalsByRoom.set(roomId, p);
    }
    return p;
  }

  private getRoleForToken(room: Room, token: string): Role | null {
    if (token === room.providerToken) return "provider";
    if (token === room.patientToken) return "patient";
    return null;
  }

  private safeClose(ws: WebSocket | undefined, code: number, reason: string) {
    if (!ws) return;
    try {
      ws.close(code, reason);
    } catch {
      // ignore
    }
  }

  private send(ws: WebSocket | undefined, msg: unknown) {
    if (!ws) return;
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // ignore
    }
  }

  private getConnState(ws: WebSocket): ConnState {
    try {
      const a = ws.deserializeAttachment() as ConnState | undefined;
      if (a && (a.roomId === null || typeof a.roomId === "string") && (a.role === null || a.role === "provider" || a.role === "patient")) {
        return a;
      }
    } catch {
      // ignore
    }
    return { roomId: null, role: null };
  }

  private setConnState(ws: WebSocket, s: ConnState) {
    try {
      ws.serializeAttachment(s);
    } catch {
      // ignore
    }
  }

  private async requireRoom(roomId: string): Promise<Room | null> {
    const inMem = this.rooms.get(roomId);
    if (inMem) return inMem;
    const stored = (await this.state.storage.get<Room>(`room:${roomId}`)) ?? null;
    if (stored) this.rooms.set(roomId, stored);
    return stored;
  }

  private async createRoom(): Promise<Room> {
    const room: Room = {
      roomId: randomHex(12),
      createdAt: Date.now(),
      providerToken: randomHex(18),
      patientToken: randomHex(18),
      sharedKey: randomHex(18),
    };
    this.rooms.set(room.roomId, room);
    await this.state.storage.put(`room:${room.roomId}`, room);
    return room;
  }

  private originIsAllowed(req: Request): boolean {
    const origin = req.headers.get("origin") || "";
    const allow = String(this.env.WEB_ORIGINS || "").trim();
    const allowAll = allow.split(",").map((s) => s.trim()).includes("*");
    if (allowAll) return true;
    if (!origin) return false;
    const set = new Set(allow.split(",").map((s) => s.trim()).filter(Boolean));
    return set.has(origin);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsHeaders(req, this.env);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (url.pathname === "/health") {
      return json({ ok: true }, { headers: cors });
    }

    if (url.pathname === "/api/rooms" && req.method === "POST") {
      if (!this.originIsAllowed(req) && String(this.env.WEB_ORIGINS || "").trim() !== "*") {
        return json({ error: "origin_not_allowed" }, { status: 403, headers: cors });
      }

      const adminKey = String(this.env.ADMIN_KEY || "").trim();
      if (adminKey) {
        const got = String(req.headers.get("x-admin-key") || "");
        if (got !== adminKey) return json({ error: "unauthorized" }, { status: 401, headers: cors });
      }

      const room = await this.createRoom();
      return json(
        {
          roomId: room.roomId,
          providerToken: room.providerToken,
          patientToken: room.patientToken,
          sharedKey: room.sharedKey,
          expiresInSeconds: 60 * 60 * 24,
        },
        { headers: cors },
      );
    }

    if (url.pathname === "/ws") {
      if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected websocket", { status: 426 });
      }

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      this.state.acceptWebSocket(server);
      this.setConnState(server, { roomId: null, role: null });
      this.send(server, { type: "hello" });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404, headers: cors });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    let msg: any = null;
    try {
      const text = typeof message === "string" ? message : new TextDecoder().decode(message);
      msg = JSON.parse(text);
    } catch {
      this.safeClose(ws, 1003, "invalid json");
      return;
    }

    const state = this.getConnState(ws);

    // Must join first.
    if (state.roomId == null || state.role == null) {
      if (!msg || msg.type !== "join" || typeof msg.roomId !== "string" || typeof msg.token !== "string") {
        this.safeClose(ws, 1008, "must join first");
        return;
      }

      void (async () => {
        const room = await this.requireRoom(msg.roomId);
        if (!room) {
          this.safeClose(ws, 1008, "unknown room");
          return;
        }

        const role = this.getRoleForToken(room, msg.token);
        if (!role) {
          this.safeClose(ws, 1008, "bad token");
          return;
        }

        const peers = this.peersByRoom.get(room.roomId) ?? {};
        // last connection wins
        if (peers[role]) {
          this.safeClose(peers[role], 4001, "replaced by new connection");
        }
        peers[role] = ws;
        this.peersByRoom.set(room.roomId, peers);

        this.setConnState(ws, { roomId: room.roomId, role });

        this.send(ws, { type: "joined", roomId: room.roomId, role });

        const otherRole: Role = role === "provider" ? "patient" : "provider";
        const other = peers[otherRole];
        if (other) {
          this.send(ws, { type: "peer", status: "connected", role: otherRole });
          this.send(other, { type: "peer", status: "connected", role });
        } else {
          this.send(ws, { type: "peer", status: "waiting", role: otherRole });
        }

        const pending = this.pendingSignalsByRoom.get(room.roomId);
        if (pending) {
          const queued = pending[role];
          pending[role] = [];
          for (const data of queued) {
            this.send(ws, { type: "signal", data });
          }
        }
      })();

      return;
    }

    // Forward signals.
    if (!msg || msg.type !== "signal") return;
    const roomId = state.roomId;
    const role = state.role;
    const peers = this.peersByRoom.get(roomId);
    if (!peers) return;

    const otherRole: Role = role === "provider" ? "patient" : "provider";
    const other = peers[otherRole];
    const payload = msg.data;
    if (other) {
      this.send(other, { type: "signal", data: payload });
    } else {
      this.getPending(roomId)[otherRole].push(payload);
    }
  }

  webSocketClose(ws: WebSocket) {
    const state = this.getConnState(ws);
    if (!state.roomId || !state.role) return;
    const peers = this.peersByRoom.get(state.roomId);
    if (!peers) return;
    if (peers[state.role] === ws) {
      delete peers[state.role];
      this.peersByRoom.set(state.roomId, peers);
      const otherRole: Role = state.role === "provider" ? "patient" : "provider";
      const other = peers[otherRole];
      if (other) this.send(other, { type: "peer", status: "disconnected", role: state.role });
    }
  }

  webSocketError(ws: WebSocket) {
    // Treat errors as closes.
    this.webSocketClose(ws);
  }
}

