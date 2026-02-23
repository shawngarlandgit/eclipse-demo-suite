import { useEffect, useMemo, useState } from "react";
import { createRoom, type RoomCreateResponse } from "../api";
import { CopyField } from "../components/CopyField";

export function CreateRoomPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomCreateResponse | null>(null);
  const [publicBaseUrl, setPublicBaseUrl] = useState<string>(() => {
    const fromEnv = (import.meta.env.VITE_PUBLIC_WEB_BASE_URL as string | undefined)?.trim();
    if (fromEnv) return fromEnv;
    const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem("secure_call_public_base_url") : "";
    if (fromStorage) return fromStorage;
    return typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5193";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("secure_call_public_base_url", publicBaseUrl.trim());
  }, [publicBaseUrl]);

  const looksLocalhost = useMemo(() => {
    const raw = publicBaseUrl.trim();
    if (!raw) return false;
    try {
      const parsed = new URL(raw);
      return ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
    } catch {
      return false;
    }
  }, [publicBaseUrl]);

  const providerUrl = room ? makeRoomUrl({ baseUrl: publicBaseUrl, roomId: room.roomId, role: "provider", token: room.providerToken, k: room.sharedKey }) : "";
  const patientUrl = room ? makeRoomUrl({ baseUrl: publicBaseUrl, roomId: room.roomId, role: "patient", token: room.patientToken, k: room.sharedKey }) : "";

  return (
    <div style={page}>
      <div style={card}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.4 }}>Secure Call</div>
          <div style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.35 }}>
            1:1 P2P video, self-hosted TURN, encrypted file exchange.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setErr(null);
              try {
                const r = await createRoom();
                setRoom(r);
              } catch (e: any) {
                setErr(e?.message ?? String(e));
              } finally {
                setLoading(false);
              }
            }}
            style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating..." : "Create Session"}
          </button>
          <a href="/" style={linkBtn}>
            Reset
          </a>
        </div>

        {err ? <div style={errBox}>{err}</div> : null}

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ color: "rgba(255,255,255,0.86)", fontSize: 13, fontWeight: 700 }}>
            Public Base URL (for links you share)
          </label>
          <input
            value={publicBaseUrl}
            onChange={(e) => setPublicBaseUrl(e.target.value)}
            placeholder="https://your-public-secure-call-url"
            style={input}
          />
          {looksLocalhost ? (
            <div style={warnBox}>
              This URL is localhost-only. Use an HTTPS public URL (for example a Cloudflare tunnel) so the patient link works on your friend's device.
            </div>
          ) : null}
        </div>

        {room ? (
          <div style={{ display: "grid", gap: 14 }}>
            <CopyField label="Provider Link" value={providerUrl} />
            <CopyField label="Patient Link" value={patientUrl} />
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              Session expires in ~{Math.round(room.expiresInSeconds / 3600)} hours (server memory TTL).
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ maxWidth: 860, color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.45 }}>
        Security note: WebRTC media and data channels are encrypted end-to-end between browsers. This v1 does not yet implement insertable-streams E2EE
        against a malicious signaling server. We add a verbal fingerprint check code in-call.
      </div>
    </div>
  );
}

function makeRoomUrl(args: { baseUrl: string; roomId: string; role: "provider" | "patient"; token: string; k: string }): string {
  const base = args.baseUrl.trim() || (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5193");
  const u = new URL(`/r/${args.roomId}`, base);
  u.searchParams.set("role", args.role);
  u.searchParams.set("token", args.token);
  u.searchParams.set("k", args.k);
  return u.toString();
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(1200px 700px at 30% 10%, rgba(20,150,120,0.16), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(180,70,140,0.12), transparent 55%), #07090c",
  color: "white",
  display: "grid",
  placeItems: "center",
  padding: 24,
  gap: 18
};

const card: React.CSSProperties = {
  width: "min(860px, 100%)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 20,
  display: "grid",
  gap: 16,
  boxShadow: "0 30px 90px rgba(0,0,0,0.55)"
};

const primaryBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "linear-gradient(180deg, rgba(40,210,160,0.22), rgba(20,120,95,0.18))",
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700
};

const linkBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700
};

const errBox: React.CSSProperties = {
  background: "rgba(255,80,80,0.10)",
  border: "1px solid rgba(255,80,80,0.25)",
  padding: 12,
  borderRadius: 12,
  color: "rgba(255,210,210,0.95)",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 12
};

const warnBox: React.CSSProperties = {
  background: "rgba(255,190,80,0.12)",
  border: "1px solid rgba(255,190,80,0.30)",
  padding: 10,
  borderRadius: 10,
  color: "rgba(255,240,205,0.95)",
  fontSize: 12
};

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(8,12,18,0.72)",
  color: "white",
  padding: "10px 12px",
  borderRadius: 10,
  outline: "none",
  fontSize: 14
};
